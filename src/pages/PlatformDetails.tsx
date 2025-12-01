import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  CheckCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Globe,
  Users,
  Settings,
  Eye,
  Plus,
  Clock,
  Ban,
  FileText,
  Code,
} from 'lucide-react';
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

const PlatformDetails = () => {
  const { id } = useParams();
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [wafRules, setWafRules] = useState([]);
  const [threatLogs, setThreatLogs] = useState<any[]>([]); // Ensure it's initialized as an empty array
  const [trafficData, setTrafficData] = useState([]);
  const [threatTypes, setThreatTypes] = useState([]);
  // New charts data - initialized with empty arrays
  const [threatTypesByCategory, setThreatTypesByCategory] = useState([]);
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
  const [timeRange, setTimeRange] = useState('7d');
  const [customRange, setCustomRange] = useState({ start: null, end: null });
  const [trafficTimeRange, setTrafficTimeRange] = useState('7d'); // Independent time range for Traffic Overview
  const [threatTimeRange, setThreatTimeRange] = useState('7d'); // Independent time range for Threats by Type
  const [trafficCustomRange, setTrafficCustomRange] = useState({ start: null, end: null }); // Separate custom range for Traffic
  const [threatCustomRange, setThreatCustomRange] = useState({ start: null, end: null }); // Separate custom range for Threats
  const navigate = useNavigate();

  const fetchData = () => {
    if (!id) return;
    setLoading(true);

    apiService.getPlatformDetails(id)
      .then((data) => {
        setPlatform(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Fetch analytics for stats cards (1 year, or '1y' if nested)
    apiService.getAnalytics(id)
      .then(data => {
        if (data.success && data.analytics) {
          // Handle nested analytics (e.g., {'1y': {...}, '7d': {...}}) or flat
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

    // Endpoints
    apiService.getPlatformEndpoints(id)
      .then(res => {
        // Ensure endpoints is always an array
        const endpointsArr = Array.isArray(res) ? res : (res.results || []);
        setEndpoints(endpointsArr);
      })
      .catch(() => setEndpoints([]));
    // WAF rules
    apiService.getPlatformWAFRules(id)
      .then(setWafRules)
      .catch(() => {});
  };

  const fetchTrafficData = () => {
    if (!id) return;

    // Fetch analytics for traffic overview chart
    const params = trafficTimeRange === 'custom' && trafficCustomRange.start && trafficCustomRange.end
      ? { start: trafficCustomRange.start.toISOString(), end: trafficCustomRange.end.toISOString() }
      : { range: trafficTimeRange };

    apiService.getAnalytics(id, params)
      .then(data => {
        if (data.success && data.analytics) {
          // Handle nested analytics or flat
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && trafficTimeRange in data.analytics) {
            analyticsData = data.analytics[trafficTimeRange];
          } else {
            analyticsData = data.analytics;
          }

          // Build trafficData from method_status_breakdown for stacked bars
          if (analyticsData.method_status_breakdown) {
            const statusColors = {
              '200': '#22c55e', // green
              '403': '#ef4444', // red
              '404': '#6366f1', // purple
              '500': '#eab308', // yellow
              '504': '#06b6d4', // cyan
              '400': '#dc2626', // dark red
              'other': '#9ca3af', // gray (default for other)
            };
            const trafficArr = HTTP_METHODS.map(method => {
              const methodData = analyticsData.method_status_breakdown[method] || {};
              return {
                method,
                ...methodData, // e.g., 200: 41, 404: 20, etc.
              };
            });
            setTrafficData(trafficArr);
          } else {
            setTrafficData([]);
          }
        }
      })
      .catch(() => setTrafficData([]));

    // Fetch latest logs for the table (last 10 logs)
    apiService.getPlatformRequestLogs(id, { num: '10' })
      .then(logs => {
        if (Array.isArray(logs)) {
          setThreatLogs(logs);
        } else {
          console.error('Unexpected response format for threat logs:', logs);
          setThreatLogs([]);
        }
      })
      .catch((err) => {
        console.error('Error fetching threat logs:', err);
        setThreatLogs([]);
      });
  };

  const fetchThreatData = () => {
    if (!id) return;

    const params = threatTimeRange === 'custom' && threatCustomRange.start && threatCustomRange.end
      ? { start: threatCustomRange.start.toISOString(), end: threatCustomRange.end.toISOString() }
      : { range: threatTimeRange };

    apiService.getAnalytics(id, params)
      .then(data => {
        if (data.success && data.analytics) {
          // Handle nested analytics or flat
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && threatTimeRange in data.analytics) {
            analyticsData = data.analytics[threatTimeRange];
          } else {
            analyticsData = data.analytics;
          }

          // Response Code Breakdown - use status_code_breakdown
          if (analyticsData.status_code_breakdown) {
            const colors = {
              '200': '#22c55e', // green
              '403': '#ef4444', // red
              '404': '#6366f1', // purple
              '500': '#eab308', // yellow
              '504': '#06b6d4', // cyan
              '400': '#dc2626', // dark red
              'other': '#9ca3af', // gray (default for other)
            };
            const responseCodeArr = Object.entries(analyticsData.status_code_breakdown).map(([name, value]) => ({
              name,
              value: Number(value),
              color: colors[name] || colors['other'],
            }));
            setThreatTypes(responseCodeArr);
          } else {
            setThreatTypes([]);
          }

          // Threats by Type - use threat_type_summary
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
              'XSS': '#f59e0b',
              'Brute Force': '#dc2626',
              'CSRF': '#06b6d4',
              'XXE': '#10b981',
              'SSRF': '#3b82f6',
              'LFI': '#f97316',
              'RFI': '#eab308',
            };
            const threatTypeArr = Object.entries(analyticsData.threat_type_summary)
              .map(([name, value]) => ({
                name,
                value: Number(value),
                color: threatTypeColors[name] || '#9ca3af',
              }))
              .filter(item => item.value > 0) // Only show threats with counts > 0
              .sort((a, b) => b.value - a.value); // Sort by value descending
            setThreatTypesByCategory(threatTypeArr);
          } else if (analyticsData.threat_types && typeof analyticsData.threat_types === 'object') {
            // Fallback to old threat_types format
            const threatTypeColors: Record<string, string> = {
              'SQL Injection': '#ef4444',
              'XSS': '#f59e0b',
              'Path Traversal': '#8b5cf6',
              'Brute Force': '#dc2626',
              'Command Injection': '#ec4899',
              'CSRF': '#06b6d4',
              'XXE': '#10b981',
              'SSRF': '#3b82f6',
              'LFI': '#f97316',
              'RFI': '#eab308',
            };
            const threatTypeArr = Object.entries(analyticsData.threat_types)
              .map(([name, value]) => ({
                name,
                value: Number(value),
                color: threatTypeColors[name] || '#9ca3af',
              }))
              .filter(item => item.value > 0)
              .sort((a, b) => b.value - a.value);
            setThreatTypesByCategory(threatTypeArr);
          } else {
            setThreatTypesByCategory([]);
          }

          // Country Data - use country_summary (new format) or country_breakdown (old format)
          if (analyticsData.country_summary && Array.isArray(analyticsData.country_summary)) {
            // New format: array of objects with country_code, country_name, total_requests
            const countryArr = analyticsData.country_summary
              .map((item: any) => ({
                code: item.country_code?.toUpperCase() || '',
                name: item.country_name || item.country_code || '',
                count: Number(item.total_requests || 0),
              }))
              .filter(item => item.count > 0 && item.code) // Only show countries with counts > 0 and valid code
              .sort((a, b) => b.count - a.count); // Sort by count descending
            setCountryData(countryArr);
          } else if (analyticsData.country_breakdown || analyticsData.geographic_breakdown) {
            // Fallback to old format: object with country codes as keys
            const countryBreakdown = analyticsData.country_breakdown || analyticsData.geographic_breakdown;
            const countryCodeToName: Record<string, string> = {
              'US': 'United States',
              'CN': 'China',
              'RU': 'Russia',
              'GB': 'United Kingdom',
              'DE': 'Germany',
              'FR': 'France',
              'IN': 'India',
              'BR': 'Brazil',
              'JP': 'Japan',
              'CA': 'Canada',
              'AU': 'Australia',
              'KR': 'South Korea',
              'IT': 'Italy',
              'ES': 'Spain',
              'NL': 'Netherlands',
              'MX': 'Mexico',
              'ID': 'Indonesia',
              'TR': 'Turkey',
              'SA': 'Saudi Arabia',
              'PL': 'Poland',
              'EG': 'Egypt',
              'CH': 'Switzerland',
            };
            const countryArr = Object.entries(countryBreakdown)
              .map(([code, count]) => ({
                code: code.toUpperCase(),
                name: countryCodeToName[code.toUpperCase()] || code,
                count: Number(count),
              }))
              .filter(item => item.count > 0) // Only show countries with counts > 0
              .sort((a, b) => b.count - a.count); // Sort by count descending
            setCountryData(countryArr);
          } else {
            setCountryData([]);
          }

          // OWASP Top 10 - use owasp_top10_summary
          if (analyticsData.owasp_top10_summary && Array.isArray(analyticsData.owasp_top10_summary)) {
            // Map OWASP categories to the expected format
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
                return {
                  name: categoryInfo.name,
                  category: categoryInfo.category,
                  count: Number(item.threat_count || 0),
                  severity: categoryInfo.severity,
                };
              })
              .filter(item => item.count > 0) // Only show categories with counts > 0
              .sort((a, b) => b.count - a.count); // Sort by count descending

            // Ensure all OWASP Top 10 items are present (with 0 counts if not in data)
            const allOwaspItems = [
              { name: 'Broken Access Control', category: 'Access Control', count: 0, severity: 'critical' as const },
              { name: 'Cryptographic Failures', category: 'Cryptography', count: 0, severity: 'high' as const },
              { name: 'Injection', category: 'Injection', count: 0, severity: 'critical' as const },
              { name: 'Insecure Design', category: 'Design', count: 0, severity: 'high' as const },
              { name: 'Security Misconfiguration', category: 'Configuration', count: 0, severity: 'medium' as const },
              { name: 'Vulnerable Components', category: 'Components', count: 0, severity: 'high' as const },
              { name: 'Authentication Failures', category: 'Authentication', count: 0, severity: 'critical' as const },
              { name: 'Software & Data Integrity', category: 'Integrity', count: 0, severity: 'high' as const },
              { name: 'Security Logging Failures', category: 'Logging', count: 0, severity: 'medium' as const },
              { name: 'Server-Side Request Forgery', category: 'SSRF', count: 0, severity: 'high' as const },
            ];

            // Merge API data with default items
            const mergedOwasp = allOwaspItems.map(defaultItem => {
              const apiItem = owaspArr.find(item => item.name === defaultItem.name);
              return apiItem || defaultItem;
            });

            setOwaspThreats(mergedOwasp);
          } else {
            // Reset to default OWASP threats with 0 counts if no data
            const defaultOwasp = [
              { name: 'Broken Access Control', category: 'Access Control', count: 0, severity: 'critical' as const },
              { name: 'Cryptographic Failures', category: 'Cryptography', count: 0, severity: 'high' as const },
              { name: 'Injection', category: 'Injection', count: 0, severity: 'critical' as const },
              { name: 'Insecure Design', category: 'Design', count: 0, severity: 'high' as const },
              { name: 'Security Misconfiguration', category: 'Configuration', count: 0, severity: 'medium' as const },
              { name: 'Vulnerable Components', category: 'Components', count: 0, severity: 'high' as const },
              { name: 'Authentication Failures', category: 'Authentication', count: 0, severity: 'critical' as const },
              { name: 'Software & Data Integrity', category: 'Integrity', count: 0, severity: 'high' as const },
              { name: 'Security Logging Failures', category: 'Logging', count: 0, severity: 'medium' as const },
              { name: 'Server-Side Request Forgery', category: 'SSRF', count: 0, severity: 'high' as const },
            ];
            setOwaspThreats(defaultOwasp);
          }
        }
      })
      .catch(() => {
        setThreatTypes([]);
        setThreatTypesByCategory([]);
        setCountryData([]);
      });
  };

  // --- Add helper to compute "other" requests (failed / non-200 excluding blocked) ---
  const getOtherRequests = (a: any) => {
    if (!a) return null;
    // prefer failed_requests - blocked_requests
    if (typeof a.failed_requests === 'number' && typeof a.blocked_requests === 'number') {
      return Number(a.failed_requests) - Number(a.blocked_requests);
    }
    // else sum non-200 codes excluding blocked codes (e.g., 403)
    if (a.status_code_breakdown && typeof a.status_code_breakdown === 'object') {
      const blockedCodes = ['403']; // assume 403 is blocked
      return Object.entries(a.status_code_breakdown).reduce((sum: number, [code, val]) => {
        if (code === '200' || blockedCodes.includes(code)) return sum;
        return sum + Number(val || 0);
      }, 0);
    }
    // fallback: total - successful - blocked (if all present)
    if (typeof a.total_requests === 'number' && typeof a.successful_requests === 'number' && typeof a.blocked_requests === 'number') {
      const inferred = Number(a.total_requests) - Number(a.successful_requests) - Number(a.blocked_requests);
      return inferred >= 0 ? inferred : 0;
    }
    return null;
  };

  const getCleanRequests = (a: any) => {
    if (!a) return null;
    // compute as total - blocked - other
    const total = typeof a.total_requests === 'number' ? Number(a.total_requests) : null;
    const blocked = typeof a.blocked_requests === 'number' ? Number(a.blocked_requests) : 0;
    const other = getOtherRequests(a);
    if (total !== null && other !== null) {
      const clean = total - blocked - other;
      return clean >= 0 ? clean : 0;
    }
    // fallback to successful_requests
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

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!platform) return <div className="p-8 text-center">Platform not found.</div>;

  return (
    <div className="space-y-6 p-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">
            Security Dashboard
            {platform && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                • {platform.name}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground">
            Real-time API security monitoring and threat analysis
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/platforms')}
            className="w-full sm:w-auto"
          >
            <Eye className="h-4 w-4 mr-2" />
            View Platforms
          </Button>
          <Button 
            size="sm" 
            className="gradient-primary w-full sm:w-auto"
            onClick={() => navigate('/onboarding')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Create New Platform
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics ? (analytics.total_requests ?? 0).toLocaleString() : '--'}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              from last year
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked Threats</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{analytics ? (analytics.blocked_requests ?? 0).toLocaleString() : '--'}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
            from last year
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clean Requests</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(() => {
                const clean = getCleanRequests(analytics);
                return clean !== null && typeof clean === 'number' ? clean.toLocaleString() : '--';
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics ? (analytics.success_rate ? analytics.success_rate.toFixed(2) : '0.00') : '--'}% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Other Requests</CardTitle>
            <Activity className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            {/* replaced single-404 display with aggregated other requests */}
            <div className="text-2xl font-bold text-purple-600">
              {(() => {
                const other = getOtherRequests(analytics);
                return other !== null && typeof other === 'number' ? other.toLocaleString() : '--';
              })()}
            </div>
            <p className="text-xs text-muted-foreground">
              Includes 404 and other non-success requests
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(endpoints)
                ? endpoints.filter(e => e.status === 'active' || e.is_active).length
                : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {Array.isArray(endpoints)
                ? endpoints.filter(e => e.status === 'active' || e.is_active).length
                : '0'} from last year
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Traffic Overview */}
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Traffic Overview</CardTitle>
                <CardDescription>
                  Request volume and threat blocking over the selected time range
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-2 py-1"
                  value={trafficTimeRange}
                  onChange={(e) => setTrafficTimeRange(e.target.value)}
                >
                  {TIME_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                {trafficTimeRange === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="border rounded px-2 py-1"
                      placeholder="Start Date"
                      value={trafficCustomRange.start ? trafficCustomRange.start.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setTrafficCustomRange((prev) => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                    />
                    <input
                      type="date"
                      className="border rounded px-2 py-1"
                      placeholder="End Date"
                      value={trafficCustomRange.end ? trafficCustomRange.end.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setTrafficCustomRange((prev) => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {trafficData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="method" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="200" stackId="a" fill="#22c55e" /> {/* Green */}
                  <Bar dataKey="403" stackId="a" fill="#ef4444" /> {/* Red */}
                  <Bar dataKey="404" stackId="a" fill="#6366f1" /> {/* Purple */}
                  <Bar dataKey="500" stackId="a" fill="#eab308" /> {/* Yellow */}
                  <Bar dataKey="504" stackId="a" fill="#06b6d4" /> {/* Cyan */}
                  <Bar dataKey="400" stackId="a" fill="#dc2626" /> {/* Dark Red */}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No traffic data available</p>
                  <p className="text-sm">Analytics data will appear here once requests are received</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Requests by Countries - Table */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>Requests by Countries</CardTitle>
            <CardDescription>
              Geographic distribution of API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {countryData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 font-medium text-muted-foreground">Country</th>
                      <th className="text-right py-2 px-3 font-medium text-muted-foreground">Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    {countryData.map((country) => {
                      // Convert country code to flag emoji
                      const getCountryFlag = (code: string) => {
                        if (!code || code.length !== 2) return '🌍';
                        const codePoints = code
                          .toUpperCase()
                          .split('')
                          .map(char => 127397 + char.charCodeAt(0));
                        return String.fromCodePoint(...codePoints);
                      };

                      return (
                        <tr 
                          key={country.code}
                          className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                          onMouseEnter={() => setHoveredCountry(country.code)}
                          onMouseLeave={() => setHoveredCountry(null)}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{getCountryFlag(country.code)}</span>
                              <span className="font-medium">{country.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-semibold">
                            {country.count.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No country data available</p>
                  <p className="text-sm">Country data will appear here once requests are received</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Threats by Type - Full Width Landscape Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Threats by Type</CardTitle>
          <CardDescription>
            Distribution of detected threat categories (SQL Injection, XSS, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {threatTypesByCategory.length > 0 ? (
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={threatTypesByCategory}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as any;
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-sm">{data.name}</p>
                            <p className="text-xs">Count: <span className="font-bold">{data.value}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                    {threatTypesByCategory.map((entry, index) => (
                      <Cell key={`cell-threat-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              <div className="text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No threat type data available</p>
                <p className="text-sm">Threat data will appear here once threats are detected</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts Row 2 - Response Code Breakdown and OWASP Top 10 */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Threat Types by Response Code */}
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Response Code Breakdown</CardTitle>
                <CardDescription>
                  Distribution of response codes over the selected time range
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <select
                  className="border rounded px-2 py-1"
                  value={threatTimeRange}
                  onChange={(e) => setThreatTimeRange(e.target.value)}
                >
                  {TIME_RANGES.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
                {threatTimeRange === 'custom' && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="border rounded px-2 py-1"
                      placeholder="Start Date"
                      value={threatCustomRange.start ? threatCustomRange.start.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setThreatCustomRange((prev) => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                    />
                    <input
                      type="date"
                      className="border rounded px-2 py-1"
                      placeholder="End Date"
                      value={threatCustomRange.end ? threatCustomRange.end.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setThreatCustomRange((prev) => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            {threatTypes.length > 0 ? (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                      data={threatTypes}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name.substring(0, 12)}${name.length > 12 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                  >
                      {threatTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No response code data available</p>
                  <p className="text-sm">Analytics data will appear here once requests are received</p>
      </div>
            </div>
            )}
          </CardContent>
        </Card>

        {/* OWASP Top 10 Detected Threats */}
        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>OWASP Top 10 Detected Threats</CardTitle>
            <CardDescription>
              Security risks based on OWASP Top 10 classification
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {owaspThreats.some(item => item.count > 0) ? (
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={owaspThreats.filter(item => item.count > 0)}>
                  <defs>
                    <linearGradient id="colorSeverity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={{ fontSize: 9 }}
                  />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as OWASPThreat;
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-sm">{data.name}</p>
                            <p className="text-xs text-muted-foreground">Category: {data.category}</p>
                            <p className="text-xs">Count: <span className="font-bold">{data.count}</span></p>
                            <p className="text-xs">Severity: <span className={`font-bold ${
                              data.severity === 'critical' ? 'text-red-600' :
                              data.severity === 'high' ? 'text-orange-600' :
                              data.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'
                            }`}>{data.severity}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ef4444" 
                    fillOpacity={1} 
                    fill="url(#colorSeverity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No OWASP threat data available</p>
                  <p className="text-sm">OWASP threat data will appear here once threats are detected</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Live Threat Activity Table */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Live Threat Activity
          </CardTitle>
          <CardDescription>
            Real-time API requests and security events
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ maxHeight: '350px' }}>
            {threatLogs.length === 0 ? (
              <div className="p-6 text-muted-foreground text-center">No threat logs found.</div>
            ) : (
              <table className="w-full text-sm border-0">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Time</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[60px]">Method</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[200px]">Path</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[60px]">Status</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[80px]">Blocked</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[80px]">Threat</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Rule</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">IP</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[200px]">User Agent</th>
                  </tr>
                </thead>
                <tbody>
                  {threatLogs.slice(0, 10).map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2 whitespace-nowrap text-xs">{log.timestamp}</td>
                      <td className="px-3 py-2 font-mono text-xs">{log.method}</td>
                      <td className="px-3 py-2 font-mono text-xs truncate max-w-[200px]" title={log.path}>{log.path}</td>
                      <td className="px-3 py-2 font-mono text-xs">{log.status_code}</td>
                      <td className="px-3 py-2">
                        {log.waf_blocked ? (
                          <Badge variant="destructive" className="text-xs">Blocked</Badge>
                        ) : (
                          <Badge variant="default" className="text-xs">Allowed</Badge>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {log.threat_level && log.threat_level !== 'none' ? (
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.threat_level === 'high' ? 'bg-red-100 text-red-700' : log.threat_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : log.threat_level === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{log.threat_level}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {log.waf_rule_triggered ? (
                          <span className="text-orange-600 text-xs truncate max-w-[100px]" title={log.waf_rule_triggered}>{log.waf_rule_triggered}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{log.client_ip}</td>
                      <td className="px-3 py-2 text-xs truncate max-w-[200px]" title={log.user_agent}>{log.user_agent}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Security Hub
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Triage security logs and alerts
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/security-hub')}>
              View all logs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Threat Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Review detailed security events
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/threat-logs')}>
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage team access and permissions
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/users')}>
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-500" />
              Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              View system activity and changes
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/audit-logs')}>
              View Logs
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-500" />
              API Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage and monitor API endpoints
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/api-endpoints')}>
              Manage Endpoints
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              WAF Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Configure security rules and policies
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/waf-rules')}>
              Configure Rules
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Ban className="h-5 w-5 text-red-600" />
              IP Blacklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage blocked IP addresses
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/ip-blacklist')}>
              Manage Blacklist
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" />
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Configure and manage security alerts
            </p>
            <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/security-alerts')}>
              View Alerts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformDetails;
