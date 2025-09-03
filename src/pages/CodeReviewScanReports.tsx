import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  RefreshCw,
  GitBranch,
  Shield,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

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

interface RepositoryScan {
  name: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  score: number;
  openFindings: number;
  resolvedFindings: number;
  lastScan: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
}

const mockScanReports: ScanReport[] = [
  {
    id: "1",
    scanId: "SCAN-2024-001",
    status: "completed",
    startTime: "2024-01-15T10:00:00Z",
    endTime: "2024-01-15T10:45:00Z",
    totalRepositories: 5,
    scannedRepositories: 5,
    openFindings: 12,
    resolvedFindings: 8,
    averageScore: 78,
    repositories: [
      { name: "api-gateway", status: "completed", score: 92, openFindings: 2, resolvedFindings: 1, lastScan: "2024-01-15", risk: "Low" },
      { name: "frontend-app", status: "completed", score: 78, openFindings: 5, resolvedFindings: 3, lastScan: "2024-01-15", risk: "Medium" },
      { name: "auth-service", status: "completed", score: 65, openFindings: 3, resolvedFindings: 2, lastScan: "2024-01-15", risk: "High" },
      { name: "payment-service", status: "completed", score: 85, openFindings: 1, resolvedFindings: 1, lastScan: "2024-01-15", risk: "Low" },
      { name: "notification-service", status: "completed", score: 72, openFindings: 1, resolvedFindings: 1, lastScan: "2024-01-15", risk: "Medium" },
    ]
  },
  {
    id: "2",
    scanId: "SCAN-2024-002",
    status: "in_progress",
    startTime: "2024-01-16T09:00:00Z",
    totalRepositories: 5,
    scannedRepositories: 2,
    openFindings: 0,
    resolvedFindings: 0,
    averageScore: 0,
    repositories: [
      { name: "api-gateway", status: "completed", score: 92, openFindings: 2, resolvedFindings: 1, lastScan: "2024-01-16", risk: "Low" },
      { name: "frontend-app", status: "completed", score: 78, openFindings: 5, resolvedFindings: 3, lastScan: "2024-01-16", risk: "Medium" },
      { name: "auth-service", status: "scanning", score: 0, openFindings: 0, resolvedFindings: 0, lastScan: "", risk: "Low" },
      { name: "payment-service", status: "pending", score: 0, openFindings: 0, resolvedFindings: 0, lastScan: "", risk: "Low" },
      { name: "notification-service", status: "pending", score: 0, openFindings: 0, resolvedFindings: 0, lastScan: "", risk: "Low" },
    ]
  }
];

const CodeReviewScanReports = () => {
  const [scanReports, setScanReports] = useState<ScanReport[]>([]);
  const [currentScan, setCurrentScan] = useState<ScanReport | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Find the current in-progress scan
    const inProgressScan = scanReports.find(report => report.status === 'in_progress');
    setCurrentScan(inProgressScan || null);
  }, [scanReports]);

  const loadScanReports = async () => {
    setLoading(true);
    try {
      const reports = await apiService.getCodeReviewScanReports();
      setScanReports(reports);
      }
    catch (error) {
      console.error('Failed to load scan reports:', error);
      // Use empty array to show empty state
      setScanReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadScanReports();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />In Progress</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
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

  const viewReport = (report: ScanReport) => {
    navigate(`/code-review-report/${report.id}`, { state: { report } });
  };

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }} 
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Scan Reports
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage code review scan reports and results
          </p>
        </div>
        <Button 
          onClick={() => navigate('/code-review-dashboard')}
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
        >
          <Shield className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Scans</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{scanReports.length}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">Completed scans</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Active Scans</CardTitle>
            <RefreshCw className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {scanReports.filter(r => r.status === 'in_progress').length}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">Currently running</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {scanReports.length > 0 
                ? Math.round(scanReports.reduce((sum, r) => sum + (r.averageScore || 0), 0) / scanReports.length)
                : 0
              }
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">Overall average</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Scan Progress */}
      {currentScan && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Current Scan in Progress</span>
              </CardTitle>
              <CardDescription className="text-blue-600 dark:text-blue-300">
                Scan ID: {currentScan.scanId} | Started: {formatDate(currentScan.startTime)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {currentScan.scannedRepositories}/{currentScan.totalRepositories}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">Repositories Scanned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {Math.round((currentScan.scannedRepositories / currentScan.totalRepositories) * 100)}%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">Progress</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {currentScan.openFindings}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">Open Findings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {currentScan.averageScore || 0}
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-300">Avg Score</div>
                </div>
              </div>
              <Progress 
                value={(currentScan.scannedRepositories / currentScan.totalRepositories) * 100} 
                className="h-3"
              />
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scan Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span>Previous Scan Reports</span>
            </CardTitle>
            <CardDescription>
              Complete history of code review scans and their results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                  <p className="text-muted-foreground">Loading scan reports...</p>
                </div>
              </div>
            ) : scanReports.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Scan Reports Found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  No code review scans have been performed yet. Start your first scan to generate reports.
                </p>
                <Button 
                  onClick={() => navigate('/code-review-dashboard')}
                  className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Start First Scan
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scan ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Repositories</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.scanId}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>{formatDate(report.startTime)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <GitBranch className="w-4 h-4 text-muted-foreground" />
                          <span>{report.scannedRepositories}/{report.totalRepositories}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-orange-600">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            {report.openFindings} Open
                          </Badge>
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {report.resolvedFindings} Resolved
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{report.averageScore}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => viewReport(report)}
                          disabled={report.status === 'in_progress'}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Report
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewScanReports; 