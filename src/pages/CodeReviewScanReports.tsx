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
  TrendingUp,
  User
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface ScanReport {
  id: string;
  status: 'in_progress' | 'completed' | 'failed';
  startTime: string;
  endTime?: string;
  openFindings: number;
  resolvedFindings: number;
  averageScore: number;
  scan_by: string;
  repositories: RepositoryScan[];
}

interface RepositoryScan {
  name: string;
  status: 'pending' | 'scanning' | 'completed' | 'failed';
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
}

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
      const token = localStorage.getItem("auth_token");
      const headers = token ? { Authorization: `Token ${token}` } : {};
      
      // Get platform ID from localStorage
      const platformId = localStorage.getItem('selected_platform_id');
      if (!platformId) {
        throw new Error("No platform selected. Please select a platform first.");
      }

      const response = await fetch(
        `${API_BASE_URL}/github/scan-reports/?platform_id=${platformId}`,
        { headers }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch scan reports: ${response.status}`);
      }
      
      const reports = await response.json();
      console.log("Scan reports response:", reports);
      setScanReports(reports);
    } catch (error) {
      console.error('Failed to load scan reports:', error);
      toast({
        title: "Error loading scan reports",
        description: error.message || "Failed to fetch scan reports",
        variant: "destructive",
      });
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
    try {
      // Fix malformed timezone format: "2025-09-03T16:30:57.174274+00:00Z" -> "2025-09-03T16:30:57.174274+00:00"
      const fixedDateString = dateString.replace(/\+00:00Z$/, '+00:00');
      return new Date(fixedDateString).toLocaleString();
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const calculateDuration = (startTime: string, endTime?: string) => {
    try {
      // Fix malformed timezone format
      const fixedStartTime = startTime.replace(/\+00:00Z$/, '+00:00');
      const start = new Date(fixedStartTime);
      
      if (!endTime) return 'In Progress';
      
      const fixedEndTime = endTime.replace(/\+00:00Z$/, '+00:00');
      const end = new Date(fixedEndTime);
      
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.round(durationMs / 1000 / 60);
      
      if (durationMinutes < 1) return '< 1m';
      if (durationMinutes < 60) return `${durationMinutes}m`;
      
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      return `${hours}h ${minutes}m`;
    } catch (error) {
      console.error('Error calculating duration:', error);
      return 'Unknown';
    }
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
        <div className="flex gap-2">
          <Button 
            onClick={loadScanReports}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={() => navigate('/code-review-dashboard')}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            <Shield className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
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
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-blue-800">
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
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Total Findings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {scanReports.reduce((sum, r) => sum + r.openFindings + r.resolvedFindings, 0)}
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300">Open + Resolved</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Avg Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {scanReports.length > 0 
                ? Math.round(scanReports.reduce((sum, r) => sum + (r.averageScore || 0), 0) / scanReports.length)
                : 0
              }
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">Overall average</p>
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
                Started: {formatDate(currentScan.startTime)} | Scanned by: {currentScan.scan_by}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {currentScan.repositories.filter(r => r.status === 'completed').length}/{currentScan.repositories.length}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Repositories Scanned</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {currentScan.openFindings}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Open Findings</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    {currentScan.repositories.filter(r => r.status === 'scanning').length}
                  </div>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Currently Scanning</p>
                </div>
              </div>
              
              {/* Repository Progress */}
              <div className="space-y-2">
                <h4 className="font-medium text-blue-800 dark:text-blue-200">Repository Progress</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentScan.repositories.map((repo, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-blue-900 rounded">
                      <span className="text-sm text-blue-900 dark:text-blue-100">{repo.name}</span>
                      <div className="flex items-center gap-2">
                        {repo.status === 'scanning' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
                        {repo.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {repo.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                        <Badge variant="outline" className="text-xs">
                          {repo.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Scan Reports Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Scan Reports</CardTitle>
            <CardDescription>
              {loading ? 'Loading scan reports...' : `${scanReports.length} scan reports found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading scan reports...</span>
              </div>
            ) : scanReports.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No scan reports found</h3>
                <p className="text-muted-foreground">No scan reports have been generated yet.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Scan ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Findings</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Scanned By</TableHead>
                    <TableHead>Repositories</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scanReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">#{report.id}</TableCell>
                      <TableCell>{getStatusBadge(report.status)}</TableCell>
                      <TableCell>{formatDate(report.startTime)}</TableCell>
                      <TableCell>
                        {calculateDuration(report.startTime, report.endTime)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="text-red-600">{report.openFindings} open</div>
                          <div className="text-green-600">{report.resolvedFindings} resolved</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{report.averageScore}</span>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full"
                              style={{ width: `${report.averageScore}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{report.scan_by}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {report.repositories.slice(0, 3).map((repo, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {repo.name}
                            </Badge>
                          ))}
                          {report.repositories.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{report.repositories.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewReport(report)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
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