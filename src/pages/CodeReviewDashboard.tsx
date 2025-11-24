import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  LayoutDashboard, 
  Shield, 
  GitBranch, 
  TrendingUp, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  Activity,
  Target,
  BarChart3,
  Gauge,
  FileWarning,
  Lock,
  Clock,
  XCircle,
  PlayCircle,
  CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  Cell,
  Legend,
  Treemap,
  AreaChart,
  Area
} from "recharts";
import { API_BASE_URL } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";

interface DashboardData {
  scan_status: {
    completed: number;
    in_progress: number;
    queued: number;
    failed: number;
  };
  scores: {
    security_score: number;
    performance_score: number;
  };
  issues_summary: {
    total_issues: number;
    resolved_issues: number;
    open_issues: number;
    security_issues: number;
    performance_issues: number;
    other_issues: number;
  };
  severity_breakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  affected_security_frameworks: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  affected_compliance_frameworks: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  top_owasp_findings: Array<{
    category: string;
    count: number;
  }>;
  total_scanned_repositories: number;
  top_api_endpoints: Array<{
  id: string;
    name: string;
    path: string;
    method: string;
    total_issues: number;
    security_percentage: number;
    performance_percentage: number;
    other_percentage: number;
    risk_level: string;
  }>;
}

const CodeReviewDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { selectedPlatformId } = usePlatform();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Token ${token}` } : {};

      if (!selectedPlatformId) {
        throw new Error("No platform selected. Please select a platform first.");
      }

      const response = await fetch(`${API_BASE_URL}/codereview/dashboard/?platform_id=${selectedPlatformId}`, { headers });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Dashboard data fetch error:', err);
        setError(err.message || "An unexpected error occurred while loading the dashboard.");
      setDashboardData(null);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };

    loadDashboard();
  }, [selectedPlatformId]);

  const startScan = async () => {
    setScanning(true);
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Token ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

      if (!selectedPlatformId) {
        throw new Error("No platform selected. Please select a platform first.");
      }

      const response = await fetch(`${API_BASE_URL}/github/scan-all/?platform_id=${selectedPlatformId}`, {
        method: "POST",
        headers,
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error("Failed to start code review scan.");
      }

      const result = await response.json();
      
      // Call manual scan alert endpoint for GitHub (same as Bitbucket)
      try {
        // Fetch repos to get repo URLs for the alert
        const reposResponse = await fetch(`${API_BASE_URL}/github/repos/?platform_id=${selectedPlatformId}`, {
          method: "GET",
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        
        if (reposResponse.ok) {
          const reposData = await reposResponse.json();
          const repos = Array.isArray(reposData) ? reposData : (reposData.results || []);
          const repoUrls = repos.map((repo: any) => repo.html_url || repo.url).filter(Boolean);
          
          if (repoUrls.length > 0) {
            await fetch(`${API_BASE_URL}/admin/manual-scan-alert/`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
              },
              body: JSON.stringify({ 
                repo_urls: repoUrls,
                platform_id: selectedPlatformId
              })
            });
          }
        }
      } catch (alertError) {
        // Log but don't fail the scan if alert fails
        console.error("Manual scan alert error:", alertError);
      }
      
      toast({
        title: "Scan Started",
        description: `Code review scan started successfully. Scan ID: ${result.scanId || "N/A"}`,
      });
      
      await fetchDashboardData();
      navigate('/code-review-scan-reports');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start code review scan.",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">{risk}</Badge>;
      case 'Medium':
        return <Badge className="bg-orange-100 text-orange-800">{risk}</Badge>;
      case 'High':
        return <Badge className="bg-red-100 text-red-800">{risk}</Badge>;
      case 'Critical':
        return <Badge className="bg-red-500 text-white">{risk}</Badge>;
      default:
        return <Badge variant="secondary">{risk}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return '#ef4444';
      case 'high':
        return '#f97316';
      case 'medium':
        return '#eab308';
      case 'low':
        return '#22c55e';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error || "Failed to load dashboard data"}</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const severityData = [
    { name: 'Critical', value: dashboardData.severity_breakdown.critical, color: '#ef4444' },
    { name: 'High', value: dashboardData.severity_breakdown.high, color: '#f97316' },
    { name: 'Medium', value: dashboardData.severity_breakdown.medium, color: '#eab308' },
    { name: 'Low', value: dashboardData.severity_breakdown.low, color: '#22c55e' },
  ];

  const issuesTypeData = [
    { name: 'Security', value: dashboardData.issues_summary.security_issues, color: '#ef4444' },
    { name: 'Performance', value: dashboardData.issues_summary.performance_issues, color: '#f97316' },
    { name: 'Other', value: dashboardData.issues_summary.other_issues, color: '#6b7280' },
  ];

  const securityFrameworksData = dashboardData.affected_security_frameworks.map(f => ({
    name: f.name,
    count: f.count,
    percentage: f.percentage,
    fill: '#3b82f6'
  }));

  const complianceFrameworksData = dashboardData.affected_compliance_frameworks.map(f => ({
    name: f.name,
    count: f.count,
    percentage: f.percentage,
    fill: '#8b5cf6'
  }));

  const owaspData = dashboardData.top_owasp_findings.map(f => ({
    name: f.category,
    value: f.count,
    fill: `hsl(${Math.random() * 360}, 70%, 50%)`
  }));

  // Gauge chart data for scores
  const scoreGaugeData = [
    { name: 'Security', value: dashboardData.scores.security_score, fill: '#22c55e' },
    { name: 'Performance', value: dashboardData.scores.performance_score, fill: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg shadow-sm"
        >
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-red-900 mb-1">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }} 
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Source Code Review Dashboard
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive security and performance analysis across all repositories
          </p>
        </div>
        <Button 
          onClick={startScan}
          // disabled={scanning}
          disabled={true}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          {scanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Run All Scans
            </>
          )}
        </Button>
      </motion.div>

      {/* Scan Status Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-light text-green-800 dark:text-green-200">Completed</p>
                <p className="text-xl font-normal text-green-900 dark:text-green-100 mt-1">
                  {dashboardData.scan_status.completed}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-light text-blue-800 dark:text-blue-200">In Progress</p>
                <p className="text-xl font-normal text-blue-900 dark:text-blue-100 mt-1">
                  {dashboardData.scan_status.in_progress}
                </p>
              </div>
              <PlayCircle className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 border-yellow-200 dark:border-yellow-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-light text-yellow-800 dark:text-yellow-200">Queued</p>
                <p className="text-xl font-normal text-yellow-900 dark:text-yellow-100 mt-1">
                  {dashboardData.scan_status.queued}
                </p>
              </div>
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-light text-red-800 dark:text-red-200">Failed</p>
                <p className="text-xl font-normal text-red-900 dark:text-red-100 mt-1">
                  {dashboardData.scan_status.failed}
                </p>
              </div>
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            </CardContent>
          </Card>
        </motion.div>

      {/* Scores and Issues Summary */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* Security Score Gauge */}
        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-emerald-800 dark:text-emerald-200 text-sm font-light">
              <Shield className="h-3 w-3" />
              <span>Security Score</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="90%" 
                    data={[{ value: dashboardData.scores.security_score, fill: '#22c55e' }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} fill="#22c55e" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-normal text-emerald-900 dark:text-emerald-100">
                      {dashboardData.scores.security_score}
                    </div>
                    <div className="text-xs font-light text-emerald-700 dark:text-emerald-300">/ 100</div>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>

        {/* Performance Score Gauge */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-blue-800 dark:text-blue-200 text-sm font-light">
              <Activity className="h-3 w-3" />
              <span>Performance Score</span>
            </CardTitle>
            </CardHeader>
            <CardContent className="pt-2">
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart 
                    cx="50%" 
                    cy="50%" 
                    innerRadius="60%" 
                    outerRadius="90%" 
                    data={[{ value: dashboardData.scores.performance_score, fill: '#3b82f6' }]}
                    startAngle={180}
                    endAngle={0}
                  >
                    <RadialBar dataKey="value" cornerRadius={10} fill="#3b82f6" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-normal text-blue-900 dark:text-blue-100">
                      {dashboardData.scores.performance_score}
                    </div>
                    <div className="text-xs font-light text-blue-700 dark:text-blue-300">/ 100</div>
                  </div>
                </div>
              </div>
            </div>
            </CardContent>
          </Card>

        {/* Issues Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-sm font-light">
              <FileWarning className="h-3 w-3 text-orange-600" />
              <span>Issues Summary</span>
            </CardTitle>
            </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-light">Total Issues</span>
                <span className="text-lg font-normal">{dashboardData.issues_summary.total_issues}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-light">Open</span>
                  <span className="font-normal">{dashboardData.issues_summary.open_issues}</span>
                </div>
                <Progress 
                  value={(dashboardData.issues_summary.open_issues / dashboardData.issues_summary.total_issues) * 100} 
                  className="h-1"
                />
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-light">Resolved</span>
                  <span className="font-normal">{dashboardData.issues_summary.resolved_issues}</span>
                </div>
                <Progress 
                  value={(dashboardData.issues_summary.resolved_issues / dashboardData.issues_summary.total_issues) * 100} 
                  className="h-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              <div className="text-center p-1.5 bg-red-50 dark:bg-red-950 rounded">
                <div className="text-sm font-normal text-red-600">{dashboardData.issues_summary.security_issues}</div>
                <div className="text-xs font-light text-red-700 dark:text-red-300">Security</div>
              </div>
              <div className="text-center p-1.5 bg-orange-50 dark:bg-orange-950 rounded">
                <div className="text-sm font-normal text-orange-600">{dashboardData.issues_summary.performance_issues}</div>
                <div className="text-xs font-light text-orange-700 dark:text-orange-300">Performance</div>
              </div>
              <div className="text-center p-1.5 bg-gray-50 dark:bg-gray-950 rounded">
                <div className="text-sm font-normal text-gray-600">{dashboardData.issues_summary.other_issues}</div>
                <div className="text-xs font-light text-gray-700 dark:text-gray-300">Other</div>
              </div>
            </div>
            </CardContent>
          </Card>
      </motion.div>

      {/* Severity Breakdown and Repositories */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Severity Breakdown - Horizontal Bar Chart */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-sm font-light">
              <BarChart3 className="h-3 w-3 text-purple-600" />
              <span>Severity Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={severityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '11px', padding: '4px 8px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Total Repositories and Issues Type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-sm font-light">
              <GitBranch className="h-3 w-3 text-blue-600" />
              <span>Repositories & Issue Types</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="mb-3">
              <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
                <div className="text-2xl font-normal bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {dashboardData.total_scanned_repositories}
                </div>
                <div className="text-xs font-light text-muted-foreground mt-1">Total Scanned Repositories</div>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-light text-xs">Issue Types Distribution</h4>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={issuesTypeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: '11px', padding: '4px 8px' }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {issuesTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security & Compliance Frameworks */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Affected Security Frameworks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-sm font-light">
              <Shield className="h-3 w-3 text-red-600" />
              <span>Affected Security Frameworks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={securityFrameworksData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: any) => `${value}%`} contentStyle={{ fontSize: '11px', padding: '4px 8px' }} />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                  {securityFrameworksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#3b82f6" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {securityFrameworksData.map((framework, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="font-light">{framework.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-normal">{framework.count} issues</span>
                    <Badge variant="outline" className="text-xs py-0 px-1">{framework.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Affected Compliance Frameworks */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-sm font-light">
              <Lock className="h-3 w-3 text-purple-600" />
              <span>Affected Compliance Frameworks</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={complianceFrameworksData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: any) => `${value}%`} contentStyle={{ fontSize: '11px', padding: '4px 8px' }} />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                  {complianceFrameworksData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill="#8b5cf6" />
                  ))}
                </Bar>
              </BarChart>
              </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {complianceFrameworksData.map((framework, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span className="font-light">{framework.name}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-normal">{framework.count} issues</span>
                    <Badge variant="outline" className="text-xs py-0 px-1">{framework.percentage}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top OWASP Findings - Treemap */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-sm font-light">
              <Target className="h-3 w-3 text-orange-600" />
              <span>Top OWASP Findings</span>
            </CardTitle>
            <CardDescription className="text-xs font-light">Most common OWASP Top 10 categories found in scans</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={owaspData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={{ fontSize: '11px', padding: '4px 8px' }} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {owaspData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 grid grid-cols-2 md:grid-cols-5 gap-1.5">
              {owaspData.map((item, index) => (
                <div key={index} className="p-2 bg-muted rounded-lg text-center">
                  <div className="text-sm font-normal">{item.value}</div>
                  <div className="text-xs font-light text-muted-foreground">{item.name}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top API Endpoints */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-1 text-sm font-light">
              <Activity className="h-3 w-3 text-indigo-600" />
              <span>Top API Endpoints with Issues</span>
            </CardTitle>
            <CardDescription className="text-xs font-light">Endpoints with the most security and performance issues</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs font-light">Endpoint</TableHead>
                  <TableHead className="text-xs font-light">Method</TableHead>
                  <TableHead className="text-xs font-light">Total Issues</TableHead>
                  <TableHead className="text-xs font-light">Security</TableHead>
                  <TableHead className="text-xs font-light">Performance</TableHead>
                  <TableHead className="text-xs font-light">Other</TableHead>
                  <TableHead className="text-xs font-light">Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboardData.top_api_endpoints.map((endpoint) => (
                  <TableRow key={endpoint.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-normal">
                      <div>
                        <div className="text-xs font-normal">{endpoint.name}</div>
                        <div className="text-xs font-light text-muted-foreground">{endpoint.path}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs py-0 px-1">
                        {endpoint.method}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-normal">{endpoint.total_issues}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-red-500 h-1.5 rounded-full"
                            style={{ width: `${endpoint.security_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-light">{endpoint.security_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-orange-500 h-1.5 rounded-full"
                            style={{ width: `${endpoint.performance_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-light">{endpoint.performance_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-gray-500 h-1.5 rounded-full"
                            style={{ width: `${endpoint.other_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-light">{endpoint.other_percentage}%</span>
                      </div>
                    </TableCell>
                    <TableCell>{getRiskBadge(endpoint.risk_level)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewDashboard;
