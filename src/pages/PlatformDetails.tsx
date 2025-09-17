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
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [id]);

  useEffect(() => {
    if (!id) return;
    // Fetch analytics using API service (auth, correct endpoint)
    apiService.getAnalytics(id)
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
      });
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
    apiService.getPlatformRequestLogs(id)
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
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!platform) return <div className="p-8 text-center">Platform not found.</div>;

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
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
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/platforms')}
          >
            <Eye className="h-4 w-4 mr-2" />
            View Platforms
          </Button>
          <Button 
            size="sm" 
            className="gradient-primary"
            onClick={() => navigate('/onboarding')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Create New Platform
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics ? (analytics.total_requests ?? 0).toLocaleString() : '--'}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% from last month
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
              -8.3% from last month
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
                : '0'} new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Traffic Overview */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Traffic Overview</CardTitle>
            <CardDescription>
              Request volume and threat blocking over the last 7 days
            </CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle>Threats by Type</CardTitle>
            <CardDescription>
              Distribution of detected threat categories
            </CardDescription>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Live Threat Activity
          </CardTitle>
          <CardDescription>
            Real-time API requests and security events
          </CardDescription>
        </CardHeader>
  <CardContent className="max-w-3xl overflow-x-auto" style={{maxHeight: '350px', overflowY: 'auto'}}>
          {threatLogs.length === 0 ? (
            <div className="text-muted-foreground">No threat logs found.</div>
          ) : (
            <table className="min-w-[700px] text-sm border rounded-lg">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Time</th>
                  <th className="px-3 py-2 text-left">Method</th>
                  <th className="px-3 py-2 text-left">Path</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-left">Blocked</th>
                  <th className="px-3 py-2 text-left">Threat</th>
                  <th className="px-3 py-2 text-left">Rule</th>
                  <th className="px-3 py-2 text-left">IP</th>
                  <th className="px-3 py-2 text-left">User Agent</th>
                </tr>
              </thead>
              <tbody>
                {threatLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-3 py-2 font-mono">{log.method}</td>
                    <td className="px-3 py-2 font-mono">{log.path}</td>
                    <td className="px-3 py-2 font-mono">{log.status_code}</td>
                    <td className="px-3 py-2">
                      {log.waf_blocked ? (
                        <Badge variant="destructive">Blocked</Badge>
                      ) : (
                        <Badge variant="default">Allowed</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {log.threat_level && log.threat_level !== 'none' ? (
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${log.threat_level === 'high' ? 'bg-red-100 text-red-700' : log.threat_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : log.threat_level === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{log.threat_level}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {log.waf_rule_triggered ? (
                        <span className="text-orange-600 text-xs">{log.waf_rule_triggered}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono">{log.client_ip}</td>
                    <td className="px-3 py-2 truncate max-w-xs" title={log.user_agent}>{log.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              WAF Rules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage security rules and policies
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
