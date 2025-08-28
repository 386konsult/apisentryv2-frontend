import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LayoutDashboard, Shield, GitBranch, TrendingUp, Zap, Users, BookOpen, Info, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { API_BASE_URL } from "@/services/api";

interface SecurityFinding {
  id: string;
  file: string;
  line: number;
  code: string;
  type: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  recommendation: string;
  suggestedFix: string;
  cve?: string;
  assignedTo?: string;
  status: string;
  repository: string;
  createdAt: string;
  resolvedAt?: string;
}

const CodeReviewDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [showFindingDetails, setShowFindingDetails] = useState(false);

  const [repos, setRepos] = useState([]);
  const [securityFindings, setSecurityFindings] = useState<SecurityFinding[]>([]);
  const [reviewFeedbackData, setReviewFeedbackData] = useState([]);
  const [toolFindingsData, setToolFindingsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        // Fetch repositories data
        const reposResponse = await fetch(`${API_BASE_URL}/github/repos/`, { headers });
        if (reposResponse.ok) {
          const reposData = await reposResponse.json();
          setRepos(reposData);
        } else {
          throw new Error("Failed to fetch repositories");
        }

        // Fetch security findings
        const findingsResponse = await fetch(`${API_BASE_URL}/github/security-findings/`, { headers });
        if (findingsResponse.ok) {
          const findingsData = await findingsResponse.json();
          const mappedFindings = findingsData.issues.map((issue: any) => ({
            id: issue.id,
            file: issue.file,
            line: issue.line,
            code: issue.code,
            type: issue.type,
            risk: issue.risk,
            recommendation: issue.recommendation,
            suggestedFix: issue.suggestedFix,
            cve: issue.cve,
            assignedTo: issue.assignedTo,
            status: issue.status,
            repository: issue.repository,
            createdAt: issue.createdAt,
            resolvedAt: issue.resolvedAt,
          }));
          setSecurityFindings(mappedFindings);
        } else {
          throw new Error("Failed to fetch security findings");
        }

        // Fetch review feedback statistics
        const feedbackResponse = await fetch(`${API_BASE_URL}/github/review-stats/`, { headers });
        if (feedbackResponse.ok) {
          const feedbackData = await feedbackResponse.json();
          setReviewFeedbackData(feedbackData.feedback_breakdown || []);
          setToolFindingsData(feedbackData.tool_findings || []);
        } else {
          throw new Error("Failed to fetch review stats");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred while loading the dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const startScan = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Token ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };

      const response = await fetch(`${API_BASE_URL}/github/scan-all/`, {
        method: "POST",
        headers,
        body: JSON.stringify({}), // Empty body
      });

      if (!response.ok) {
        throw new Error("Failed to start code review scan.");
      }

      const result = await response.json();
      toast({
        title: "Scan Started",
        description: `Code review scan started successfully. Scan ID: ${result.scanId || "N/A"}`,
      });
      navigate('/code-review-scan-reports');
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to start code review scan.",
        variant: "destructive",
      });
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Open':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getResolutionBadge = (resolution?: string) => {
    if (!resolution) return null;
    switch (resolution) {
      case 'Fixed':
        return <Badge className="bg-green-100 text-green-800">{resolution}</Badge>;
      case 'Accepted':
        return <Badge className="bg-blue-100 text-blue-800">{resolution}</Badge>;
      case 'Marked False Positive':
        return <Badge className="bg-gray-100 text-gray-800">{resolution}</Badge>;
      default:
        return <Badge variant="secondary">{resolution}</Badge>;
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

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Source Code Review</h1>
          <p className="text-muted-foreground mt-2">Monitor codebase security, risk, and team habits across all connected repositories</p>
        </div>
        <Button 
          onClick={startScan}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Zap className="w-4 h-4 mr-2" />Run All Scans
        </Button>
      </motion.div>

      {/* Metrics Cards */}
      <motion.div initial="hidden" animate="visible" variants={{hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:0.1}}}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Connected Repos</CardTitle>
              <GitBranch className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{repos.length}</div>
              <p className="text-xs text-blue-700 dark:text-blue-300">Active integrations</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Avg Security Score</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{Math.round(repos.reduce((a,b)=>a+b.score,0)/repos.length)}</div>
              <p className="text-xs text-green-700 dark:text-green-300">Across all repos</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Risk Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{repos.filter(r=>r.risk!=='Low').length}</div>
              <p className="text-xs text-orange-700 dark:text-orange-300">Repos with risk</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Last Scan</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{repos[0].lastScan}</div>
              <p className="text-xs text-purple-700 dark:text-purple-300">Most recent</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
                {/* Review Feedback Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
              <span>Review Feedback Breakdown</span>
              <Info className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reviewFeedbackData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) =>
                      percent > 0 ? `${name}: ${value}` : ""
                    }
                    labelLine={true}
                  >
                    {reviewFeedbackData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {reviewFeedbackData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Tool Findings Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <span>Tool Findings Breakdown</span>
              <Info className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={toolFindingsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value, percent }) =>
                      percent > 0 ? `${name}: ${value}` : ""
                    }
                    labelLine={true}
                  >
                    {toolFindingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
              {toolFindingsData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Security Findings Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-red-600" />
              <span>Recent Tool Findings</span>
              <Info className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Line</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {securityFindings.map((finding) => (
                  <TableRow
                    key={finding.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedFinding(finding);
                      setShowFindingDetails(true);
                    }}
                  >
                    <TableCell className="font-medium">{finding.file}</TableCell>
                    <TableCell>{finding.line}</TableCell>
                    <TableCell>{finding.type}</TableCell>
                    <TableCell>{getRiskBadge(finding.risk)}</TableCell>
                    <TableCell>{getStatusBadge(finding.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Finding Details Dialog */}
      <Dialog open={showFindingDetails} onOpenChange={setShowFindingDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Security Finding Details - {selectedFinding?.type}</DialogTitle>
          </DialogHeader>
          
          {selectedFinding && (
            <div className="space-y-6">
              {/* Finding Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span>{selectedFinding.type}</span>
                    {getRiskBadge(selectedFinding.risk)}
                  </CardTitle>
                  <CardDescription>{selectedFinding.recommendation}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">File:</span>
                      <span className="ml-2 font-medium">{selectedFinding.file}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Line:</span>
                      <span className="ml-2 font-medium">{selectedFinding.line}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repository:</span>
                      <span className="ml-2 font-medium">{selectedFinding.repository}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Created At:</span>
                      <span className="ml-2 font-medium">
                        {new Date(selectedFinding.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {selectedFinding.resolvedAt && (
                      <div>
                        <span className="text-muted-foreground">Resolved At:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedFinding.resolvedAt).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Suggested Fix */}
              <Card>
                <CardHeader>
                  <CardTitle>Suggested Fix</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                    {selectedFinding.suggestedFix}
                  </pre>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeReviewDashboard;