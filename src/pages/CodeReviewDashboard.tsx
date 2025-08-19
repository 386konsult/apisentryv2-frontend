import { useState } from "react";
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

interface SecurityFinding {
  id: string;
  category: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  count: number;
  repositoriesAffected: number;
  description: string;
  cwe?: string;
  owaspCategory?: string;
  findings: FindingDetail[];
}

interface FindingDetail {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved';
  resolution?: 'Fixed' | 'Accepted' | 'Marked False Positive';
  repository: string;
  file: string;
  line: number;
  type: 'PR' | 'Commit' | 'Full Scan';
  createdAt: string;
  resolvedAt?: string;
  cwe?: string;
  owaspCategory?: string;
}

const repos = [
  { name: "api-gateway", score: 92, risk: "Low", lastScan: "2024-01-15", status: "Healthy" },
  { name: "frontend-app", score: 78, risk: "Medium", lastScan: "2024-01-14", status: "Issues Found" },
  { name: "auth-service", score: 65, risk: "High", lastScan: "2024-01-13", status: "Critical" },
];

// Security findings data
const securityFindings: SecurityFinding[] = [
  {
    id: "1",
    category: "SQL Injection",
    severity: "Critical",
    count: 32,
    repositoriesAffected: 8,
    description: "SQL injection vulnerabilities in database queries",
    cwe: "CWE-89",
    owaspCategory: "A03:2021 - Injection",
    findings: [
      {
        id: "f1",
        title: "SQL Injection in User Authentication",
        description: "Direct user input used in SQL query without proper sanitization",
        severity: "Critical",
        status: "Open",
        repository: "ipservices",
        file: "src/auth/service.py",
        line: 45,
        type: "PR",
        createdAt: "2024-01-15T10:30:00Z",
        cwe: "CWE-89",
        owaspCategory: "A03:2021 - Injection"
      },
      {
        id: "f2",
        title: "SQL Injection in Search Function",
        description: "User input concatenated directly into SQL query",
        severity: "Critical",
        status: "Resolved",
        resolution: "Fixed",
        repository: "frontend-app",
        file: "src/search/query.py",
        line: 23,
        type: "Commit",
        createdAt: "2024-01-14T09:15:00Z",
        resolvedAt: "2024-01-14T10:30:00Z",
        cwe: "CWE-89",
        owaspCategory: "A03:2021 - Injection"
      }
    ]
  },
  {
    id: "2",
    category: "Cross-Site Scripting (XSS)",
    severity: "High",
    count: 28,
    repositoriesAffected: 6,
    description: "Cross-site scripting vulnerabilities in web applications",
    cwe: "CWE-79",
    owaspCategory: "A03:2021 - Injection",
    findings: [
      {
        id: "f3",
        title: "Reflected XSS in Search Results",
        description: "User input reflected in HTML without proper encoding",
        severity: "High",
        status: "Open",
        repository: "web-portal",
        file: "src/templates/search.html",
        line: 67,
        type: "Full Scan",
        createdAt: "2024-01-13T14:20:00Z",
        cwe: "CWE-79",
        owaspCategory: "A03:2021 - Injection"
      }
    ]
  },
  {
    id: "3",
    category: "Broken Authentication",
    severity: "High",
    count: 25,
    repositoriesAffected: 5,
    description: "Authentication and session management vulnerabilities",
    cwe: "CWE-287",
    owaspCategory: "A07:2021 - Identification and Authentication Failures",
    findings: [
      {
        id: "f4",
        title: "Weak Password Policy",
        description: "Password policy allows weak passwords",
        severity: "High",
        status: "Resolved",
        resolution: "Fixed",
        repository: "auth-service",
        file: "src/auth/validators.py",
        line: 12,
        type: "PR",
        createdAt: "2024-01-12T11:45:00Z",
        resolvedAt: "2024-01-12T12:30:00Z",
        cwe: "CWE-521",
        owaspCategory: "A07:2021 - Identification and Authentication Failures"
      }
    ]
  },
  {
    id: "4",
    category: "Sensitive Data Exposure",
    severity: "High",
    count: 22,
    repositoriesAffected: 4,
    description: "Exposure of sensitive information in logs, errors, or responses",
    cwe: "CWE-200",
    owaspCategory: "A02:2021 - Cryptographic Failures",
    findings: [
      {
        id: "f5",
        title: "API Keys in Logs",
        description: "API keys logged in application logs",
        severity: "High",
        status: "Open",
        repository: "api-gateway",
        file: "src/logging/config.py",
        line: 34,
        type: "Commit",
        createdAt: "2024-01-11T16:20:00Z",
        cwe: "CWE-532",
        owaspCategory: "A02:2021 - Cryptographic Failures"
      }
    ]
  },
  {
    id: "5",
    category: "Security Misconfiguration",
    severity: "Medium",
    count: 18,
    repositoriesAffected: 7,
    description: "Security configuration issues in applications and infrastructure",
    cwe: "CWE-16",
    owaspCategory: "A05:2021 - Security Misconfiguration",
    findings: [
      {
        id: "f6",
        title: "Debug Mode Enabled in Production",
        description: "Debug mode enabled in production environment",
        severity: "Medium",
        status: "Resolved",
        resolution: "Fixed",
        repository: "backend-service",
        file: "src/config/settings.py",
        line: 89,
        type: "Full Scan",
        createdAt: "2024-01-10T13:15:00Z",
        resolvedAt: "2024-01-10T14:00:00Z",
        cwe: "CWE-489",
        owaspCategory: "A05:2021 - Security Misconfiguration"
      }
    ]
  },
  {
    id: "6",
    category: "Insecure Deserialization",
    severity: "Critical",
    count: 15,
    repositoriesAffected: 3,
    description: "Insecure deserialization of user-controlled data",
    cwe: "CWE-502",
    owaspCategory: "A08:2021 - Software and Data Integrity Failures",
    findings: [
      {
        id: "f7",
        title: "Unsafe JSON Deserialization",
        description: "User-controlled JSON data deserialized without validation",
        severity: "Critical",
        status: "Open",
        repository: "data-processor",
        file: "src/utils/serializer.py",
        line: 56,
        type: "PR",
        createdAt: "2024-01-09T10:30:00Z",
        cwe: "CWE-502",
        owaspCategory: "A08:2021 - Software and Data Integrity Failures"
      }
    ]
  }
];

// Chart data for breakdown
const reviewFeedbackData = [
  { name: "Refactor Suggestions", value: 161, color: "#3b82f6" },
  { name: "Issues Found", value: 147, color: "#10b981" },
  { name: "Verification Suggestions", value: 52, color: "#8b5cf6" },
  { name: "Nitpick Suggestions", value: 8, color: "#f59e0b" }
];

const toolFindingsData = [
  { name: "SQL Injection", value: 32, color: "#dc2626" },
  { name: "XSS Vulnerabilities", value: 28, color: "#ea580c" },
  { name: "Broken Authentication", value: 25, color: "#d97706" },
  { name: "Sensitive Data Exposure", value: 22, color: "#7c3aed" },
  { name: "Security Misconfiguration", value: 18, color: "#0891b2" },
  { name: "Insecure Deserialization", value: 15, color: "#65a30d" }
];

const CodeReviewDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedFinding, setSelectedFinding] = useState<SecurityFinding | null>(null);
  const [showFindingDetails, setShowFindingDetails] = useState(false);

  const startScan = async () => {
    try {
      const result = await apiService.startCodeReviewScan();
      toast({
        title: "Scan Started",
        description: `Code review scan started successfully. Scan ID: ${result.scanId}`,
      });
      // Navigate to scan reports page
      navigate('/code-review-scan-reports');
    } catch (error) {
      console.error('Failed to start scan:', error);
      toast({
        title: "Error",
        description: "Failed to start code review scan. Using mock data for demonstration.",
        variant: "destructive",
      });
      // Still navigate to show mock data
      navigate('/code-review-scan-reports');
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

  return (
    <div className="space-y-6">
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
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
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
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
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
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
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
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
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
                  <TableHead>Category</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Repositories Affected</TableHead>
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
                    <TableCell className="font-medium">{finding.category}</TableCell>
                    <TableCell>{getRiskBadge(finding.severity)}</TableCell>
                    <TableCell>{finding.count}</TableCell>
                    <TableCell>{finding.repositoriesAffected}</TableCell>
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
            <DialogTitle>Security Finding Details - {selectedFinding?.category}</DialogTitle>
          </DialogHeader>
          
          {selectedFinding && (
            <div className="space-y-6">
              {/* Finding Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-red-600" />
                    <span>{selectedFinding.category}</span>
                    {getRiskBadge(selectedFinding.severity)}
                  </CardTitle>
                  <CardDescription>{selectedFinding.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total Count:</span>
                      <span className="ml-2 font-medium">{selectedFinding.count}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Repositories Affected:</span>
                      <span className="ml-2 font-medium">{selectedFinding.repositoriesAffected}</span>
                    </div>
                    {selectedFinding.cwe && (
                      <div>
                        <span className="text-muted-foreground">CWE:</span>
                        <span className="ml-2 font-medium">{selectedFinding.cwe}</span>
                      </div>
                    )}
                    {selectedFinding.owaspCategory && (
                      <div>
                        <span className="text-muted-foreground">OWASP Category:</span>
                        <span className="ml-2 font-medium">{selectedFinding.owaspCategory}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Individual Findings */}
              <Card>
                <CardHeader>
                  <CardTitle>Individual Findings</CardTitle>
                  <CardDescription>
                    Detailed list of all findings for this category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedFinding.findings.map((finding) => (
                      <Card key={finding.id} className="border-l-4 border-l-red-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                <span className="font-medium">{finding.title}</span>
                                <Badge variant="outline">{finding.type}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                              <div className="flex items-center space-x-2 mb-2">
                                <Badge variant="outline">{finding.repository}</Badge>
                                <span className="text-sm text-muted-foreground">
                                  {finding.file}:{finding.line}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(finding.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                {getRiskBadge(finding.severity)}
                                {getStatusBadge(finding.status)}
                                {getResolutionBadge(finding.resolution)}
                                {finding.cwe && (
                                  <Badge variant="outline" className="text-xs">
                                    {finding.cwe}
                                  </Badge>
                                )}
                                {finding.owaspCategory && (
                                  <Badge variant="outline" className="text-xs">
                                    {finding.owaspCategory}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
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