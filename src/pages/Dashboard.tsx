
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
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
} from "lucide-react";
import { useEffect, useState } from "react";
import { apiService, DashboardStats, TrafficData, ThreatTypeData } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

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

const OWASP_TOP_10 = [
  { id: 'A01', name: 'Broken Access Control', category: 'Access Control', severity: 'critical' },
  { id: 'A02', name: 'Cryptographic Failures', category: 'Cryptography', severity: 'high' },
  { id: 'A03', name: 'Injection', category: 'Injection', severity: 'critical' },
  { id: 'A04', name: 'Insecure Design', category: 'Design', severity: 'high' },
  { id: 'A05', name: 'Security Misconfiguration', category: 'Configuration', severity: 'medium' },
  { id: 'A06', name: 'Vulnerable Components', category: 'Components', severity: 'high' },
  { id: 'A07', name: 'Authentication Failures', category: 'Authentication', severity: 'critical' },
  { id: 'A08', name: 'Software & Data Integrity', category: 'Integrity', severity: 'high' },
  { id: 'A09', name: 'Security Logging Failures', category: 'Logging', severity: 'medium' },
  { id: 'A10', name: 'Server-Side Request Forgery', category: 'SSRF', severity: 'high' },
];

const Dashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  // Initialize with dummy data immediately so charts render
  const [trafficData, setTrafficData] = useState<TrafficData[]>([
    { name: 'GET', requests: 1000, blocked: 50, allowed: 950 },
    { name: 'POST', requests: 800, blocked: 40, allowed: 760 },
    { name: 'PUT', requests: 600, blocked: 30, allowed: 570 },
    { name: 'DELETE', requests: 400, blocked: 20, allowed: 380 },
  ]);
  const [threatTypes, setThreatTypes] = useState<ThreatTypeData[]>([
    { name: 'SQL Injection', value: 45, color: '#ef4444' },
    { name: 'XSS', value: 32, color: '#f59e0b' },
    { name: 'Path Traversal', value: 28, color: '#8b5cf6' },
    { name: 'Brute Force', value: 22, color: '#dc2626' },
    { name: 'Command Injection', value: 15, color: '#ec4899' },
    { name: 'CSRF', value: 12, color: '#06b6d4' },
    { name: 'XXE', value: 8, color: '#10b981' },
  ]);
  const [owaspThreats, setOwaspThreats] = useState<OWASPThreat[]>([
    { name: 'Broken Access Control', category: 'Access Control', count: 85, severity: 'critical' },
    { name: 'Cryptographic Failures', category: 'Cryptography', count: 62, severity: 'high' },
    { name: 'Injection', category: 'Injection', count: 94, severity: 'critical' },
    { name: 'Insecure Design', category: 'Design', count: 45, severity: 'high' },
    { name: 'Security Misconfiguration', category: 'Configuration', count: 38, severity: 'medium' },
    { name: 'Vulnerable Components', category: 'Components', count: 52, severity: 'high' },
    { name: 'Authentication Failures', category: 'Authentication', count: 78, severity: 'critical' },
    { name: 'Software & Data Integrity', category: 'Integrity', count: 35, severity: 'high' },
    { name: 'Security Logging Failures', category: 'Logging', count: 28, severity: 'medium' },
    { name: 'Server-Side Request Forgery', category: 'SSRF', count: 41, severity: 'high' },
  ]);
  const [countryData, setCountryData] = useState<CountryData[]>([
    { code: 'US', name: 'United States', count: 1245 },
    { code: 'CN', name: 'China', count: 892 },
    { code: 'RU', name: 'Russia', count: 678 },
    { code: 'GB', name: 'United Kingdom', count: 543 },
    { code: 'DE', name: 'Germany', count: 412 },
    { code: 'FR', name: 'France', count: 356 },
    { code: 'IN', name: 'India', count: 789 },
    { code: 'BR', name: 'Brazil', count: 445 },
    { code: 'JP', name: 'Japan', count: 321 },
    { code: 'CA', name: 'Canada', count: 298 },
    { code: 'AU', name: 'Australia', count: 234 },
    { code: 'KR', name: 'South Korea', count: 189 },
  ]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<{id: string; name: string} | null>(null);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load selected platform from localStorage
    const platformId = localStorage.getItem('selected_platform_id');
    if (platformId) {
      const storedPlatforms = localStorage.getItem('user_platforms');
      if (storedPlatforms) {
        const platforms = JSON.parse(storedPlatforms);
        const platform = platforms.find((p: {id: string; name: string}) => p.id === platformId);
        if (platform) {
          setSelectedPlatform(platform);
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const statsData = await apiService.getDashboardStats();
        setStats(statsData);

        // Parse traffic data if available (example: from method_breakdown)
        if (statsData.method_breakdown) {
          const trafficArr = Object.entries(statsData.method_breakdown).map(([name, value]) => ({
            name,
            requests: Number(value),
            blocked: Math.floor(Number(value) * 0.1),
            allowed: Math.floor(Number(value) * 0.9),
          }));
          setTrafficData(trafficArr);
        } else {
          // Dummy traffic data
          setTrafficData([
            { name: 'GET', requests: 1000, blocked: 50, allowed: 950 },
            { name: 'POST', requests: 800, blocked: 40, allowed: 760 },
            { name: 'PUT', requests: 600, blocked: 30, allowed: 570 },
            { name: 'DELETE', requests: 400, blocked: 20, allowed: 380 },
          ]);
        }

        // Dummy data for Threats by Type (Pie Chart)
        setThreatTypes([
          { name: 'SQL Injection', value: 45, color: '#ef4444' },
          { name: 'XSS', value: 32, color: '#f59e0b' },
          { name: 'Path Traversal', value: 28, color: '#8b5cf6' },
          { name: 'Brute Force', value: 22, color: '#dc2626' },
          { name: 'Command Injection', value: 15, color: '#ec4899' },
          { name: 'CSRF', value: 12, color: '#06b6d4' },
          { name: 'XXE', value: 8, color: '#10b981' },
        ]);

        // Dummy data for OWASP Top 10 (Area Chart)
        const owaspData: OWASPThreat[] = [
          { name: 'Broken Access Control', category: 'Access Control', count: 85, severity: 'critical' },
          { name: 'Cryptographic Failures', category: 'Cryptography', count: 62, severity: 'high' },
          { name: 'Injection', category: 'Injection', count: 94, severity: 'critical' },
          { name: 'Insecure Design', category: 'Design', count: 45, severity: 'high' },
          { name: 'Security Misconfiguration', category: 'Configuration', count: 38, severity: 'medium' },
          { name: 'Vulnerable Components', category: 'Components', count: 52, severity: 'high' },
          { name: 'Authentication Failures', category: 'Authentication', count: 78, severity: 'critical' },
          { name: 'Software & Data Integrity', category: 'Integrity', count: 35, severity: 'high' },
          { name: 'Security Logging Failures', category: 'Logging', count: 28, severity: 'medium' },
          { name: 'Server-Side Request Forgery', category: 'SSRF', count: 41, severity: 'high' },
        ];
        setOwaspThreats(owaspData);

        // Dummy data for Requests by Countries (Map)
        const countries: CountryData[] = [
          { code: 'US', name: 'United States', count: 1245 },
          { code: 'CN', name: 'China', count: 892 },
          { code: 'RU', name: 'Russia', count: 678 },
          { code: 'GB', name: 'United Kingdom', count: 543 },
          { code: 'DE', name: 'Germany', count: 412 },
          { code: 'FR', name: 'France', count: 356 },
          { code: 'IN', name: 'India', count: 789 },
          { code: 'BR', name: 'Brazil', count: 445 },
          { code: 'JP', name: 'Japan', count: 321 },
          { code: 'CA', name: 'Canada', count: 298 },
          { code: 'AU', name: 'Australia', count: 234 },
          { code: 'KR', name: 'South Korea', count: 189 },
        ].sort((a, b) => b.count - a.count);
        setCountryData(countries);
      } catch (error) {
        toast({
          title: "Error loading dashboard data",
          description: "Failed to fetch dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const getStatusBadge = (status: string) => {
    const variants = {
      blocked: "destructive",
      quarantined: "secondary",
      allowed: "default",
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || "default"}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (!selectedPlatform) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h2 className="text-xl font-semibold mb-2">No Platform Selected</h2>
        <p className="text-muted-foreground mb-6">
          Please select a platform to view its dashboard
        </p>
        <div className="flex gap-4 justify-center">
          <Button onClick={() => navigate('/platforms')} className="gradient-primary">
            <Eye className="h-4 w-4 mr-2" />
            View Platforms
          </Button>
          <Button variant="outline" onClick={() => navigate('/onboarding')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Platform
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No dashboard data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Security Dashboard
            {selectedPlatform && (
              <span className="text-lg font-normal text-muted-foreground ml-2">
                • {selectedPlatform.name}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(stats.total_requests ?? 0).toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-red-600">{(stats.blocked_threats ?? 0).toLocaleString()}</div>
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
            <div className="text-2xl font-bold text-green-600">{(stats.clean_requests ?? 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total_requests && stats.clean_requests ? ((stats.clean_requests / stats.total_requests) * 100).toFixed(2) : '0.00'}% success rate
            </p>
          </CardContent>
        </Card>

        <Card className="tech-glow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Endpoints</CardTitle>
            <Globe className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active_endpoints ?? 0}</div>
            <p className="text-xs text-muted-foreground">
              12 new this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
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
            <div style={{ width: '100%', height: '300px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trafficData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="allowed" stackId="a" fill="hsl(142 71% 45%)" />
                  <Bar dataKey="blocked" stackId="a" fill="hsl(0 84% 60%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Threats by Type - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Threats by Type</CardTitle>
            <CardDescription>
              Distribution of detected threat categories
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
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
                    label={({ name, percent }) => `${name.substring(0, 15)}${name.length > 15 ? '...' : ''} ${(percent * 100).toFixed(0)}%`}
                  >
                    {threatTypes.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 - OWASP Top 10 and World Map */}
      test
      <div className="grid gap-4 md:grid-cols-2">
        {/* OWASP Top 10 Detected Threats */}
        <Card>
          <CardHeader>
            <CardTitle>OWASP Top 10 Detected Threats</CardTitle>
            <CardDescription>
              Security risks based on OWASP Top 10 classification
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div style={{ width: '100%', height: '350px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={owaspThreats}>
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
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload as OWASPThreat;
                        return (
                          <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                            <p className="font-semibold">{data.name}</p>
                            <p className="text-sm text-muted-foreground">Category: {data.category}</p>
                            <p className="text-sm">Count: <span className="font-bold">{data.count}</span></p>
                            <p className="text-sm">Severity: <span className={`font-bold ${
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
          </CardContent>
        </Card>

        {/* Requests by Countries - World Map */}
        <Card>
          <CardHeader>
            <CardTitle>Requests by Countries</CardTitle>
            <CardDescription>
              Geographic distribution of API requests
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-4">
              {/* Simplified World Map Visualization */}
              <div className="relative w-full h-[300px] border border-border rounded-lg bg-muted/20 p-4 overflow-hidden">
                <div className="grid grid-cols-4 gap-2 h-full">
                  {countryData.slice(0, 12).map((country) => {
                    const maxCount = Math.max(...countryData.map(c => c.count), 1);
                    const intensity = country.count / maxCount;
                    const isHovered = hoveredCountry === country.code;
                    
                    return (
                      <div
                        key={country.code}
                        className="relative group cursor-pointer"
                        onMouseEnter={() => setHoveredCountry(country.code)}
                        onMouseLeave={() => setHoveredCountry(null)}
                      >
                        <div
                          className={`w-full h-full rounded-lg border-2 transition-all ${
                            isHovered 
                              ? 'border-primary shadow-lg scale-105' 
                              : 'border-border'
                          }`}
                          style={{
                            backgroundColor: `rgba(239, 68, 68, ${0.3 + intensity * 0.7})`,
                            minHeight: '60px',
                          }}
                        >
                          <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                            <span className="text-xs font-bold text-foreground">
                              {country.code}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1">
                              {country.count}
                            </span>
                          </div>
                        </div>
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-background border border-border rounded-lg p-3 shadow-xl min-w-[150px]">
                            <p className="font-semibold text-sm">{country.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Requests: <span className="font-bold text-primary">{country.count.toLocaleString()}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {countryData.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No country data available
                  </div>
                )}
              </div>
              
              {/* Country List */}
              <div className="space-y-2 max-h-[100px] overflow-y-auto">
                {countryData.slice(0, 5).map((country) => (
                  <div
                    key={country.code}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onMouseEnter={() => setHoveredCountry(country.code)}
                    onMouseLeave={() => setHoveredCountry(null)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold">{country.code}</span>
                      <span className="text-sm">{country.name}</span>
                    </div>
                    <span className="text-sm font-semibold">{country.count.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Live Threat Activity
          </CardTitle>
          <CardDescription>
            Real-time security events and threat detections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(Array.isArray(stats?.recent_threats) ? stats.recent_threats : []).map((threat) => (
              <div
                key={threat.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{threat.threat_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {threat.timestamp}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm">{threat.request_path}</span>
                    <span className="text-xs text-muted-foreground">
                      from {threat.source_ip}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(threat.status)}
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
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

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage team access and tokens
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Users
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Integrations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Connect external tools and alerts
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Setup Integrations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
