import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  ArrowLeft, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield, 
  GitBranch,
  TrendingUp,
  Clock,
  Calendar,
  Users,
  Code,
  Eye,
  ExternalLink,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter
} from "lucide-react";
import { motion } from "framer-motion";

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved' | 'In Progress';
  category: string;
  file: string;
  line: number;
  cwe?: string;
  recommendation: string;
  createdAt: string;
  resolvedAt?: string;
}

interface RepositoryScan {
  name: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  score: number;
  openFindings: number;
  resolvedFindings: number;
  lastScan: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
  findings: Finding[];
  totalLines: number;
  scannedLines: number;
  languages: string[];
  contributors: number;
}

interface ScanReport {
  id: string;
  scanId: string;
  status: 'in_progress' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  totalRepositories: number;
  scannedRepositories: number;
  openFindings: number;
  resolvedFindings: number;
  averageScore: number;
  repositories: RepositoryScan[];
}

const mockFindings: Finding[] = [
  {
    id: "1",
    title: "SQL Injection Vulnerability",
    description: "Potential SQL injection vulnerability detected in user input handling",
    severity: "High",
    status: "Open",
    category: "Injection",
    file: "src/auth/service.py",
    line: 45,
    cwe: "CWE-89",
    recommendation: "Use parameterized queries or ORM to prevent SQL injection",
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    title: "Hardcoded API Key",
    description: "API key found hardcoded in source code",
    severity: "Critical",
    status: "Resolved",
    category: "Secrets",
    file: "src/config/settings.py",
    line: 23,
    cwe: "CWE-259",
    recommendation: "Move API keys to environment variables or secure secret management",
    createdAt: "2024-01-15T10:25:00Z",
    resolvedAt: "2024-01-15T11:00:00Z"
  },
  {
    id: "3",
    title: "XSS Vulnerability",
    description: "Cross-site scripting vulnerability in user input rendering",
    severity: "Medium",
    status: "In Progress",
    category: "XSS",
    file: "src/templates/user_profile.html",
    line: 67,
    cwe: "CWE-79",
    recommendation: "Sanitize user input and use proper output encoding",
    createdAt: "2024-01-15T10:35:00Z"
  },
  {
    id: "4",
    title: "Weak Password Policy",
    description: "Password policy allows weak passwords",
    severity: "Low",
    status: "Open",
    category: "Authentication",
    file: "src/auth/validators.py",
    line: 12,
    cwe: "CWE-521",
    recommendation: "Implement stronger password requirements",
    createdAt: "2024-01-15T10:40:00Z"
  }
];

// Generate mock repositories for large organization simulation
const generateMockRepositories = (): RepositoryScan[] => {
  const repoNames = [
    "api-gateway", "frontend-app", "auth-service", "payment-service", "notification-service",
    "user-service", "order-service", "inventory-service", "shipping-service", "analytics-service",
    "reporting-service", "admin-dashboard", "mobile-app", "web-portal", "data-processor",
    "ml-pipeline", "recommendation-engine", "search-service", "cache-service", "queue-service",
    "file-storage", "image-processor", "email-service", "sms-service", "push-notification",
    "webhook-service", "api-docs", "monitoring-service", "logging-service", "backup-service",
    "security-service", "compliance-service", "audit-service", "billing-service", "subscription-service",
    "customer-service", "support-portal", "knowledge-base", "help-desk", "ticket-system",
    "project-management", "task-tracker", "time-tracking", "resource-management", "budget-tracker",
    "hr-portal", "payroll-service", "benefits-portal", "recruitment-system", "onboarding-service",
    "training-platform", "certification-system", "performance-review", "goal-tracker", "feedback-system",
    "survey-platform", "polling-service", "voting-system", "election-service", "referendum-platform",
    "marketplace", "auction-service", "bidding-system", "escrow-service", "dispute-resolution",
    "insurance-portal", "claims-service", "policy-management", "risk-assessment", "fraud-detection",
    "compliance-checker", "regulatory-reporting", "audit-trail", "data-governance", "privacy-service",
    "gdpr-compliance", "ccpa-compliance", "hipaa-compliance", "sox-compliance", "pci-compliance",
    "security-scanner", "vulnerability-assessor", "threat-detector", "incident-response", "forensics-service",
    "penetration-testing", "security-audit", "code-review", "dependency-scanner", "license-checker",
    "open-source-audit", "third-party-risk", "supply-chain-security", "vendor-management", "contract-service",
    "legal-portal", "document-management", "signature-service", "notary-service", "witness-system",
    "court-portal", "case-management", "evidence-tracker", "jury-selection", "verdict-service"
  ];

  const riskLevels: ('Low' | 'Medium' | 'High' | 'Critical')[] = ['Low', 'Medium', 'High', 'Critical'];
  const languages = [
    ['Python', 'JavaScript', 'HTML'], ['TypeScript', 'React', 'CSS'], ['Java', 'Spring', 'SQL'],
    ['Go', 'Docker', 'YAML'], ['Rust', 'Cargo', 'TOML'], ['C#', '.NET', 'XML'],
    ['PHP', 'Laravel', 'Blade'], ['Ruby', 'Rails', 'ERB'], ['Node.js', 'Express', 'JSON'],
    ['Scala', 'Akka', 'SBT'], ['Kotlin', 'Spring', 'Gradle'], ['Swift', 'iOS', 'Storyboard']
  ];

  return repoNames.map((name, index) => ({
    name,
    status: index < 5 ? 'completed' : (index < 10 ? 'scanning' : 'pending') as 'pending' | 'scanning' | 'completed' | 'failed',
    score: Math.floor(Math.random() * 40) + 60, // 60-100
    openFindings: Math.floor(Math.random() * 8),
    resolvedFindings: Math.floor(Math.random() * 5),
    lastScan: index < 5 ? "2024-01-15" : "",
    risk: riskLevels[Math.floor(Math.random() * riskLevels.length)],
    findings: index < 3 ? mockFindings.slice(0, Math.floor(Math.random() * 3) + 1) : [],
    totalLines: Math.floor(Math.random() * 50000) + 5000,
    scannedLines: index < 5 ? Math.floor(Math.random() * 50000) + 5000 : 0,
    languages: languages[Math.floor(Math.random() * languages.length)],
    contributors: Math.floor(Math.random() * 20) + 1
  }));
};

const mockRepositoryData: RepositoryScan = {
  name: "api-gateway",
  status: "completed",
  score: 92,
  openFindings: 2,
  resolvedFindings: 1,
  lastScan: "2024-01-15",
  risk: "Low",
  findings: mockFindings,
  totalLines: 15420,
  scannedLines: 15420,
  languages: ["Python", "JavaScript", "HTML"],
  contributors: 8
};

const CodeReviewReport = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const [report, setReport] = useState<ScanReport | null>(null);
  const [selectedRepo, setSelectedRepo] = useState<RepositoryScan | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [repositoriesPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    // Get report data from location state or mock data
    if (location.state?.report) {
      setReport(location.state.report);
      setSelectedRepo(location.state.report.repositories[0]);
    } else {
      // Mock data for demonstration with large repository list
      const mockRepositories = generateMockRepositories();
      const mockReport: ScanReport = {
        id: reportId || "1",
        scanId: "SCAN-2024-001",
        status: "completed",
        startTime: "2024-01-15T10:00:00Z",
        endTime: "2024-01-15T10:45:00Z",
        totalRepositories: mockRepositories.length,
        scannedRepositories: mockRepositories.filter(r => r.status === 'completed').length,
        openFindings: mockRepositories.reduce((sum, repo) => sum + repo.openFindings, 0),
        resolvedFindings: mockRepositories.reduce((sum, repo) => sum + repo.resolvedFindings, 0),
        averageScore: Math.round(mockRepositories.reduce((sum, repo) => sum + repo.score, 0) / mockRepositories.length),
        repositories: mockRepositories
      };
      setReport(mockReport);
      setSelectedRepo(mockRepositories[0]);
    }
  }, [reportId, location.state]);

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return <Badge className="bg-red-500 text-white">{severity}</Badge>;
      case 'High':
        return <Badge className="bg-red-100 text-red-800">{severity}</Badge>;
      case 'Medium':
        return <Badge className="bg-orange-100 text-orange-800">{severity}</Badge>;
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">{severity}</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'In Progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Open':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Filter and paginate repositories
  const filteredRepositories = report?.repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRisk = riskFilter === "all" || repo.risk === riskFilter;
    const matchesStatus = statusFilter === "all" || repo.status === statusFilter;
    return matchesSearch && matchesRisk && matchesStatus;
  }) || [];

  const totalPages = Math.ceil(filteredRepositories.length / repositoriesPerPage);
  const startIndex = (currentPage - 1) * repositoriesPerPage;
  const endIndex = startIndex + repositoriesPerPage;
  const currentRepositories = filteredRepositories.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, riskFilter, statusFilter]);

  if (!report || !selectedRepo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/code-review-scan-reports')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Reports</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Scan Report: {report.scanId}
            </h1>
            <p className="text-muted-foreground mt-2">
              Detailed analysis of code review scan results
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {formatDate(report.startTime)}
          </span>
        </div>
      </motion.div>

      {/* Repository Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <GitBranch className="w-5 h-5 text-blue-600" />
              <span>Select Repository</span>
            </CardTitle>
            <CardDescription>
              Showing {filteredRepositories.length} of {report.repositories.length} repositories
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search repositories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={riskFilter} onValueChange={setRiskFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Risk Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="Low">Low Risk</SelectItem>
                  <SelectItem value="Medium">Medium Risk</SelectItem>
                  <SelectItem value="High">High Risk</SelectItem>
                  <SelectItem value="Critical">Critical Risk</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="scanning">Scanning</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Repository Grid */}
            {currentRepositories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentRepositories.map((repo) => (
                <Card
                  key={repo.name}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedRepo?.name === repo.name
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950'
                      : ''
                  }`}
                  onClick={() => setSelectedRepo(repo)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold truncate">{repo.name}</h3>
                      {getRiskBadge(repo.risk)}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Score:</span>
                        <span className="font-medium">{repo.score}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span>Findings:</span>
                        <span className="font-medium">{repo.openFindings + repo.resolvedFindings}</span>
                      </div>
                      <Progress value={repo.score} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters to find repositories.
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && currentRepositories.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredRepositories.length)} of {filteredRepositories.length} repositories
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Repository Details */}
      {selectedRepo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="findings">Findings</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Security Score</CardTitle>
                    <Shield className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedRepo.score}</div>
                    <Progress value={selectedRepo.score} className="mt-2" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Open Findings</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{selectedRepo.openFindings}</div>
                    <p className="text-xs text-muted-foreground">Requires attention</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Resolved Findings</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{selectedRepo.resolvedFindings}</div>
                    <p className="text-xs text-muted-foreground">Fixed issues</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{getRiskBadge(selectedRepo.risk)}</div>
                    <p className="text-xs text-muted-foreground">Overall assessment</p>
                  </CardContent>
                </Card>
              </div>

              {/* Repository Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Repository Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Repository Name:</span>
                        <span>{selectedRepo.name}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Last Scan:</span>
                        <span>{selectedRepo.lastScan}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Total Lines:</span>
                        <span>{(selectedRepo.totalLines || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Scanned Lines:</span>
                        <span>{(selectedRepo.scannedLines || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Languages:</span>
                        <div className="flex space-x-2">
                          {(selectedRepo.languages || []).map((lang) => (
                            <Badge key={lang} variant="outline">{lang}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Contributors:</span>
                        <span>{selectedRepo.contributors || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Scan Status:</span>
                        <Badge className={selectedRepo.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                          {selectedRepo.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="findings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Findings</CardTitle>
                  <CardDescription>
                    Detailed list of security issues found during the scan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Finding</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(selectedRepo.findings || []).map((finding) => (
                        <TableRow key={finding.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{finding.title}</div>
                              <div className="text-sm text-muted-foreground">{finding.description}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getSeverityBadge(finding.severity)}</TableCell>
                          <TableCell>{getStatusBadge(finding.status)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{finding.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{finding.file}</div>
                              <div className="text-muted-foreground">Line {finding.line}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security Metrics</CardTitle>
                  <CardDescription>
                    Detailed metrics and analysis of the codebase security
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Finding Distribution</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Critical:</span>
                          <span className="font-medium">{(selectedRepo.findings || []).filter(f => f.severity === 'Critical').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">High:</span>
                          <span className="font-medium">{(selectedRepo.findings || []).filter(f => f.severity === 'High').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Medium:</span>
                          <span className="font-medium">{(selectedRepo.findings || []).filter(f => f.severity === 'Medium').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Low:</span>
                          <span className="font-medium">{(selectedRepo.findings || []).filter(f => f.severity === 'Low').length}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold">Status Distribution</h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Open:</span>
                          <span className="font-medium">{(selectedRepo.findings || []).filter(f => f.status === 'Open').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">In Progress:</span>
                          <span className="font-medium">{(selectedRepo.findings || []).filter(f => f.status === 'In Progress').length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Resolved:</span>
                          <span className="font-medium">{(selectedRepo.findings || []).filter(f => f.status === 'Resolved').length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Scan Details</CardTitle>
                  <CardDescription>
                    Technical details about the scan execution and configuration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Scan Configuration</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Scan Type:</span>
                            <span>Full Security Analysis</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Scan Engine:</span>
                            <span>CodeQL v2.15.0</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Rules Applied:</span>
                            <span>1,247 security rules</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Scan Duration:</span>
                            <span>45 minutes</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Coverage</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Files Scanned:</span>
                            <span>1,247 files</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lines of Code:</span>
                            <span>{(selectedRepo.totalLines || 0).toLocaleString()} LOC</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Coverage:</span>
                            <span>100%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Languages:</span>
                            <span>{(selectedRepo.languages || []).join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </div>
  );
};

export default CodeReviewReport; 
