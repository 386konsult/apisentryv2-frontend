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
  const navigate = useNavigate();

  const fetchData = () => {
    if (!id) return;
    setLoading(true);

    const params = timeRange === 'custom' && customRange.start && customRange.end
      ? { start: customRange.start.toISOString(), end: customRange.end.toISOString() }
      : { range: timeRange };

    apiService.getPlatformDetails(id)
      .then((data) => {
        setPlatform(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    // Fetch analytics using API service (auth, correct endpoint)
    apiService.getAnalytics(id, params)
      .then(data => {
        if (data.success && data.analytics) {
          setAnalytics(data.analytics);
          // Threat types pie chart (keep as is)
          if (data.analytics.status_code_breakdown) {
            const colors = {
              '200': '#22c55e', // green for 200
              '403': '#ef4444', // red for 403
              '404': '#6366f1',
              '500': '#eab308',
              'other': '#06b6d4',
            };
            const threatArr = Object.entries(data.analytics.status_code_breakdown).map(([name, value], i) => ({
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
    // Request logs using API service (auth, correct endpoint)
    apiService.getPlatformRequestLogs(id, params)
      .then(logs => {
        setThreatLogs(logs);

        // --- Build trafficData by method and status, always show all methods ---
        const methodMap: Record<string, { allowed: number; blocked: number; notFound: number }> = {};
        logs.forEach((log: any) => {
          const method = (log.method || 'OTHER').toUpperCase();
          if (!methodMap[method]) {
            methodMap[method] = { allowed: 0, blocked: 0, notFound: 0 };
          }
          if (log.status_code === 404) {
            methodMap[method].notFound += 1;
          } else if (log.waf_blocked) {
            methodMap[method].blocked += 1;
          } else {
            methodMap[method].allowed += 1;
          }
        });
        // Ensure all HTTP_METHODS are present, even if zero
        const trafficArr = HTTP_METHODS.map(method => ({
          name: method,
          ...(methodMap[method] || { allowed: 0, blocked: 0, notFound: 0 }),
        }));
        // Optionally, add "OTHER" if there are logs with unknown methods
        if (Object.keys(methodMap).some(m => !HTTP_METHODS.includes(m))) {
          trafficArr.push({
            name: 'OTHER',
            ...(methodMap['OTHER'] || { allowed: 0, blocked: 0, notFound: 0 }),
          });
        }
        setTrafficData(trafficArr);
      })
      .catch(() => {
        setThreatLogs([]);
        setTrafficData([]);
      });
  };

  const fetchTrafficData = () => {
    const params = trafficTimeRange === 'custom' && customRange.start && customRange.end
      ? { start: customRange.start.toISOString(), end: customRange.end.toISOString() }
      : { range: trafficTimeRange };

    apiService.getPlatformRequestLogs(id, params)
      .then(logs => {
        setThreatLogs(logs);

        // --- Build trafficData by method and status, always show all methods ---
        const methodMap: Record<string, { allowed: number; blocked: number; notFound: number }> = {};
        logs.forEach((log: any) => {
          const method = (log.method || 'OTHER').toUpperCase();
          if (!methodMap[method]) {
            methodMap[method] = { allowed: 0, blocked: 0, notFound: 0 };
          }
          if (log.status_code === 404) {
            methodMap[method].notFound += 1;
          } else if (log.waf_blocked) {
            methodMap[method].blocked += 1;
          } else {
            methodMap[method].allowed += 1;
          }
        });
        // Ensure all HTTP_METHODS are present, even if zero
        const trafficArr = HTTP_METHODS.map(method => ({
          name: method,
          ...(methodMap[method] || { allowed: 0, blocked: 0, notFound: 0 }),
        }));
        // Optionally, add "OTHER" if there are logs with unknown methods
        if (Object.keys(methodMap).some(m => !HTTP_METHODS.includes(m))) {
          trafficArr.push({
            name: 'OTHER',
            ...(methodMap['OTHER'] || { allowed: 0, blocked: 0, notFound: 0 }),
          });
        }
        setTrafficData(trafficArr);
      })
      .catch(() => {
        setThreatLogs([]);
        setTrafficData([]);
      });
  };

  const fetchThreatData = () => {
    const params = threatTimeRange === 'custom' && customRange.start && customRange.end
      ? { start: customRange.start.toISOString(), end: customRange.end.toISOString() }
      : { range: threatTimeRange };

    apiService.getAnalytics(id, params)
      .then(data => {
        if (data.success && data.analytics) {
          // Threat types pie chart (keep as is)
          if (data.analytics.status_code_breakdown) {
            const colors = {
              '200': '#22c55e', // green for 200
              '403': '#ef4444', // red for 403
              '404': '#6366f1',
              '500': '#eab308',
              'other': '#06b6d4',
            };
            const threatArr = Object.entries(data.analytics.status_code_breakdown).map(([name, value], i) => ({
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

  useEffect(() => {
    fetchData();
  }, [id, timeRange, customRange]);

  useEffect(() => {
    fetchTrafficData();
  }, [id, trafficTimeRange, customRange]);

  useEffect(() => {
    fetchThreatData();
  }, [id, threatTimeRange, customRange]);

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
            <div className="text-2xl font-bold text-green-600">{analytics ? (analytics.successful_requests ?? 0).toLocaleString() : '--'}</div>
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
            <div className="text-2xl font-bold text-purple-600">{analytics && analytics.status_code_breakdown && analytics.status_code_breakdown['404'] ? analytics.status_code_breakdown['404'] : '--'}</div>
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
                      value={customRange.start ? customRange.start.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                    />
                    <input
                      type="date"
                      className="border rounded px-2 py-1"
                      placeholder="End Date"
                      value={customRange.end ? customRange.end.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
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
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="allowed" stackId="a" fill="hsl(142 71% 45%)" />
                  <Bar dataKey="blocked" stackId="a" fill="hsl(0 84% 60%)" />
                  <Bar dataKey="notFound" stackId="a" fill="#6366f1" />
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
                      value={customRange.start ? customRange.start.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setCustomRange((prev) => ({ ...prev, start: e.target.value ? new Date(e.target.value) : null }))}
                    />
                    <input
                      type="date"
                      className="border rounded px-2 py-1"
                      placeholder="End Date"
                      value={customRange.end ? customRange.end.toISOString().slice(0, 10) : ''}
                      onChange={(e) => setCustomRange((prev) => ({ ...prev, end: e.target.value ? new Date(e.target.value) : null }))}
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
