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
} from 'lucide-react';
import apiService from '@/services/api';
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const TIME_RANGES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Year', value: '1y' },
  { label: 'Custom', value: 'custom' },
];

const PlatformDetails = () => {
  const { id } = useParams();
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [wafRules, setWafRules] = useState([]);
  const [threatLogs, setThreatLogs] = useState([]);
  const [trafficData, setTrafficData] = useState([]);
  const [threatTypes, setThreatTypes] = useState([]);
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
          console.log('Analytics data for 1y:', analyticsData); // Detailed log
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
          console.log('Traffic analytics data for', trafficTimeRange, ':', analyticsData); // Detailed log

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

    // Fetch latest logs for the table (always top 10, no range)
    apiService.getPlatformRequestLogs(id, {})
      .then(logs => {
        setThreatLogs(logs);
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
          console.log('Threat analytics data for', threatTimeRange, ':', analyticsData); // Detailed log

          // Threat types pie chart
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
            const threatArr = Object.entries(analyticsData.status_code_breakdown).map(([name, value]) => ({
              name,
              value: Number(value),
              color: colors[name] || colors['other'],
            }));
            setThreatTypes(threatArr);
          } else {
            setThreatTypes([]);
          }
        }
      })
      .catch(() => setThreatTypes([]));
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
    console.log('Traffic time range changed:', trafficTimeRange); // Log when timeRange changes
    fetchTrafficData();
  }, [id, trafficTimeRange, trafficCustomRange]);

  useEffect(() => {
    console.log('Threat time range changed:', threatTimeRange); // Log when timeRange changes
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
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Traffic Overview */}
        <Card className="lg:col-span-2 min-w-0">
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

        {/* Threat Types */}
        <Card className="min-w-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Threats by Type</CardTitle>
                <CardDescription>
                  Distribution of detected threat categories over the selected time range
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
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={threatTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(Array.isArray(threatTypes) ? threatTypes : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
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
              Manage security logs and alerts
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Configure Rules
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
            <Button variant="outline" size="sm" className="w-full">
              View Logs
            </Button>
          </CardContent>
        </Card>

      {/* Threat Logs List (improved UI) */}
      
      </div>
    </div>
  );
};

export default PlatformDetails;
