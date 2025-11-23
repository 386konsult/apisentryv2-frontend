import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Activity,
  Shield,
  AlertTriangle,
  Clock,
  Globe,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface AnalyticsData {
  endpoint_id: string;
  endpoint_name: string;
  endpoint_path: string;
  endpoint_method: string;
  metrics: {
    security_score: number;
    health_score: number;
    error_rate: number;
    error_rate_change?: number;
    avg_response_time: number;
    avg_response_time_change?: number;
    performance_score: number;
  };
  traffic_data: {
    "30d": Array<{ date: string; requests: number }>;
    "1y": Array<{ date: string; requests: number }>;
  };
  security_issues: Array<{
    id: number;
    type: string;
    severity: string;
    description: string;
    file: string;
    status: string;
    discovered: string;
  }>;
  performance_issues: Array<{
    id: number;
    type: string;
    severity: string;
    description: string;
    file: string;
    status: string;
    discovered: string;
  }>;
  request_logs: Array<{
    id: number;
    timestamp: string;
    ip: string;
    country: string;
    status: number;
    method: string;
    response_time: number;
    user_agent: string;
  }>;
  top_ip_addresses: Array<{
    ip: string;
    country: string;
    country_code?: string;
    requests: number;
    flag?: string;
  }>;
}

const EndpointAnalytics = () => {
  const { endpointId } = useParams<{ endpointId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [timeRange, setTimeRange] = useState<"30d" | "1y">("30d");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ipFilter, setIpFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!endpointId) {
        setError("Endpoint ID is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        const response = await fetch(
          `${API_BASE_URL}/api-endpoints/${endpointId}/analytics/`,
          { headers }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch analytics: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        setAnalyticsData(data);
        setError("");
      } catch (err: any) {
        console.error("Error fetching analytics:", err);
        setError(err.message || "Failed to load analytics data");
        toast({
          title: "Error",
          description: err.message || "Failed to load analytics data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [endpointId, toast]);

  // Use API data or fallback to empty arrays
  const trafficData30d = analyticsData?.traffic_data?.["30d"] || [];
  const trafficData1y = analyticsData?.traffic_data?.["1y"] || [];
  const securityIssues = analyticsData?.security_issues || [];
  const performanceIssues = analyticsData?.performance_issues || [];
  const requestLogs = (analyticsData?.request_logs || []).map(log => ({
    ...log,
    responseTime: log.response_time || log.responseTime || 0
  }));

  const topIPs = analyticsData?.top_ip_addresses || [];

  const metrics = analyticsData?.metrics ? {
    securityScore: analyticsData.metrics.security_score,
    healthScore: analyticsData.metrics.health_score,
    errorRate: analyticsData.metrics.error_rate,
    errorRateChange: analyticsData.metrics.error_rate_change,
    avgResponseTime: analyticsData.metrics.avg_response_time,
    avgResponseTimeChange: analyticsData.metrics.avg_response_time_change,
    performanceScore: analyticsData.metrics.performance_score,
  } : {
    securityScore: 0,
    healthScore: 0,
    errorRate: 0,
    errorRateChange: 0,
    avgResponseTime: 0,
    avgResponseTimeChange: 0,
    performanceScore: 0,
  };

  // Filter request logs
  const filteredLogs = requestLogs.filter((log) => {
    const matchesSearch = searchTerm === "" || log.ip.includes(searchTerm) || log.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || String(log.status).startsWith(statusFilter);
    const matchesIP = ipFilter === "" || log.ip.includes(ipFilter);
    const matchesDate = dateFilter === "" || log.timestamp.includes(dateFilter);
    return matchesSearch && matchesStatus && matchesIP && matchesDate;
  });

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 300 && status < 400) return "text-yellow-600";
    if (status >= 400 && status < 500) return "text-orange-600";
    return "text-red-600";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500 text-white";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      case "Low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    return status === "Resolved" ? (
      <Badge className="bg-green-100 text-green-800">Resolved</Badge>
    ) : (
      <Badge className="bg-orange-100 text-orange-800">Open</Badge>
    );
  };

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !analyticsData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/api-endpoints")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/api-endpoints")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Endpoint Analytics</h1>
            <p className="text-muted-foreground">
              {analyticsData?.endpoint_method || "GET"} {analyticsData?.endpoint_path || `/api/v1/users/${endpointId}`}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.securityScore}</div>
            <p className="text-xs text-muted-foreground">/100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.healthScore}</div>
            <p className="text-xs text-muted-foreground">/100</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{metrics.errorRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.errorRateChange !== undefined && metrics.errorRateChange !== 0 && (
                <>
                  {metrics.errorRateChange < 0 ? (
                    <TrendingDown className="h-3 w-3 inline text-green-600" />
                  ) : (
                    <TrendingUp className="h-3 w-3 inline text-red-600" />
                  )}
                  {Math.abs(metrics.errorRateChange)}% from last week
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {metrics.avgResponseTimeChange !== undefined && metrics.avgResponseTimeChange !== 0 && (
                <>
                  {metrics.avgResponseTimeChange < 0 ? (
                    <>
                      <TrendingDown className="h-3 w-3 inline text-green-600" /> {Math.abs(metrics.avgResponseTimeChange)}ms faster
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-3 w-3 inline text-red-600" /> {metrics.avgResponseTimeChange}ms slower
                    </>
                  )}
                </>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{metrics.performanceScore}</div>
            <p className="text-xs text-muted-foreground">/100</p>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Traffic Overview</CardTitle>
              <CardDescription>
                Request volume over the selected time period
              </CardDescription>
            </div>
            <Select value={timeRange} onValueChange={(value: "30d" | "1y") => setTimeRange(value)}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeRange === "30d" ? trafficData30d : trafficData1y}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="requests"
                stroke="hsl(217 91% 60%)"
                strokeWidth={2}
                dot={{ fill: "hsl(217 91% 60%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Security and Performance Issues */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              Security Issues
            </CardTitle>
            <CardDescription>
              Issues discovered through source code review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityIssues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <span className="font-medium">{issue.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {issue.file}
                      </p>
                    </div>
                    {getStatusBadge(issue.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Discovered: {issue.discovered}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-500" />
              Performance Issues
            </CardTitle>
            <CardDescription>
              Performance bottlenecks identified in code review
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {performanceIssues.map((issue) => (
                <div key={issue.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={getSeverityColor(issue.severity)}>
                          {issue.severity}
                        </Badge>
                        <span className="font-medium">{issue.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{issue.description}</p>
                      <p className="text-xs text-muted-foreground mt-1 font-mono">
                        {issue.file}
                      </p>
                    </div>
                    {getStatusBadge(issue.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Discovered: {issue.discovered}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top IP Addresses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Top IP Addresses by Request Volume
          </CardTitle>
          <CardDescription>
            Countries and IPs with the most requests to this endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              {topIPs.map((item, index) => (
                <div key={item.ip} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.flag}</span>
                    <div>
                      <p className="font-medium">{item.country}</p>
                      <p className="text-sm text-muted-foreground font-mono">{item.ip}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{item.requests.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">requests</p>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={topIPs}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ country, percent }) => `${country} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="requests"
                  >
                    {topIPs.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Request Logs</CardTitle>
          <CardDescription>
            Most recent 20 requests to this endpoint
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IP or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="2">2xx Success</SelectItem>
                <SelectItem value="3">3xx Redirect</SelectItem>
                <SelectItem value="4">4xx Client Error</SelectItem>
                <SelectItem value="5">5xx Server Error</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by IP..."
              value={ipFilter}
              onChange={(e) => setIpFilter(e.target.value)}
              className="w-[150px]"
            />
            <Input
              type="date"
              placeholder="Filter by date..."
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-[150px]"
            />
          </div>

          {/* Logs Table */}
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No logs found matching the filters
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${getStatusColor(log.status)} bg-transparent border`}
                        >
                          {log.status}
                        </Badge>
                        <Badge variant="outline">{log.method}</Badge>
                      </div>
                      <div className="flex-1">
                        <p className="font-mono text-sm">{log.ip}</p>
                        <p className="text-xs text-muted-foreground">{log.country}</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {log.timestamp}
                      </div>
                      <div className="text-sm font-medium">
                        {log.responseTime}ms
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EndpointAnalytics;

