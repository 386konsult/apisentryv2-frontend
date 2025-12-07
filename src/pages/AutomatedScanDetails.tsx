import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  GitBranch, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Loader2,
  FileText,
  MessageSquare,
  Shield,
  Code,
  User,
  Calendar,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface AutomatedRun {
  id: string | number;
  repo_id?: string;
  repo_name?: string;
  repo_url?: string;
  status: 'Queued' | 'In Progress' | 'Completed' | 'Failed';
  trigger_type: 'webhook_push' | 'webhook_pr_created' | 'webhook_pr_updated';
  pr_id?: string;
  pr_number?: string | number;
  branch_name?: string;
  target_branch?: string;
  commit_sha?: string;
  total_files_scanned?: number;
  total_issues_found?: number;
  contributor_username?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  analysis_run_id?: string;
}

interface PRScanSummary {
  id: string;
  pr_id: string;
  total_issues: number;
  security_issues: number;
  performance_issues: number;
  critical_issues: number;
  open_comments: number;
  resolved_comments: number;
}

interface PRComment {
  id: string;
  comment_id: string;
  file_path: string;
  line_number: number;
  status: 'open' | 'resolved';
  issue_type: 'security' | 'performance' | 'code_quality';
  issue_category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  issue_title: string;
  issue_description: string;
  code_snippet?: string;
  solution_code?: string;
  recommended_code?: string;
}

interface AutomatedRunDetailsResponse {
  automated_run: AutomatedRun;
  pr_scan_summary: PRScanSummary | null;
  pr_comments: PRComment[];
}

const AutomatedScanDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<AutomatedRunDetailsResponse | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No automated run ID provided");
      setLoading(false);
      return;
    }

    const fetchDetails = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await apiService.getAutomatedRunDetails(id);
        setData(response);
      } catch (err: any) {
        console.error("Error fetching automated run details:", err);
        setError(err.message || "Failed to load automated run details");
        toast({
          title: "Error loading details",
          description: err.message || "Failed to fetch automated run details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, toast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Completed
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            In Progress
          </Badge>
        );
      case 'Queued':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Queued
          </Badge>
        );
      case 'Failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTriggerTypeBadge = (triggerType: string) => {
    switch (triggerType) {
      case 'webhook_push':
        return <Badge variant="outline">Push</Badge>;
      case 'webhook_pr_created':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700">PR Created</Badge>;
      case 'webhook_pr_updated':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">PR Updated</Badge>;
      default:
        return <Badge variant="outline">{triggerType}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge className="bg-red-500 text-white">Critical</Badge>;
      case 'high':
        return <Badge className="bg-orange-500 text-white">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500 text-white">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-500 text-white">Low</Badge>;
      default:
        return <Badge variant="secondary">{severity}</Badge>;
    }
  };

  const getIssueTypeBadge = (issueType: string) => {
    switch (issueType) {
      case 'security':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Security</Badge>;
      case 'performance':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Performance</Badge>;
      case 'code_quality':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Code Quality</Badge>;
      default:
        return <Badge variant="outline">{issueType}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const fixedDateString = dateString.replace(/\+00:00Z$/, '+00:00');
      return new Date(fixedDateString).toLocaleString();
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Loading automated run details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate('/git-automated-scan')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Automated Scans
        </Button>
        <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Error loading details</h3>
                <p className="text-sm">{error || "Failed to load automated run details"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { automated_run, pr_scan_summary, pr_comments } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/git-automated-scan')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Automated Scan Details
              </h1>
              <p className="text-muted-foreground mt-2">
                Detailed information about automated scan run #{automated_run.id}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-2">{getStatusBadge(automated_run.status)}</div>
            <p className="text-xs text-muted-foreground">Run status</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Files Scanned</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automated_run.total_files_scanned || 0}</div>
            <p className="text-xs text-muted-foreground">Total files</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{automated_run.total_issues_found || 0}</div>
            <p className="text-xs text-muted-foreground">Total issues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trigger Type</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="mb-2">{getTriggerTypeBadge(automated_run.trigger_type)}</div>
            <p className="text-xs text-muted-foreground">Scan trigger</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {pr_scan_summary && <TabsTrigger value="summary">PR Summary</TabsTrigger>}
          <TabsTrigger value="comments">
            PR Comments ({pr_comments.length})
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Run Information</CardTitle>
              <CardDescription>Basic information about this automated scan run</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Repository</label>
                    <div className="flex items-center gap-2 mt-1">
                      <GitBranch className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{automated_run.repo_name || automated_run.repo_url || 'Unknown'}</span>
                    </div>
                    {automated_run.repo_url && (
                      <p className="text-xs text-muted-foreground mt-1">{automated_run.repo_url}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Branch</label>
                    <p className="font-medium mt-1">{automated_run.branch_name || 'N/A'}</p>
                    {automated_run.target_branch && (
                      <p className="text-xs text-muted-foreground mt-1">Target: {automated_run.target_branch}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Commit SHA</label>
                    {automated_run.commit_sha ? (
                      <p className="font-mono text-sm mt-1">{automated_run.commit_sha}</p>
                    ) : (
                      <p className="text-muted-foreground mt-1">N/A</p>
                    )}
                  </div>

                  {automated_run.contributor_username && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contributor</label>
                      <div className="flex items-center gap-2 mt-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{automated_run.contributor_username}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Created At</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDate(automated_run.created_at)}</span>
                    </div>
                  </div>

                  {automated_run.started_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Started At</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(automated_run.started_at)}</span>
                      </div>
                    </div>
                  )}

                  {automated_run.completed_at && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Completed At</label>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle className="w-4 h-4 text-muted-foreground" />
                        <span>{formatDate(automated_run.completed_at)}</span>
                      </div>
                    </div>
                  )}

                  {automated_run.pr_number && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Pull Request</label>
                      <p className="font-medium mt-1">PR #{automated_run.pr_number}</p>
                      {automated_run.pr_id && (
                        <p className="text-xs text-muted-foreground mt-1">ID: {automated_run.pr_id}</p>
                      )}
                    </div>
                  )}

                  {automated_run.analysis_run_id && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Analysis Run ID</label>
                      <p className="font-mono text-sm mt-1">{automated_run.analysis_run_id}</p>
                    </div>
                  )}
                </div>
              </div>

              {automated_run.error_message && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-red-800 dark:text-red-200 mb-1">Error Message</h4>
                      <p className="text-sm text-red-700 dark:text-red-300">{automated_run.error_message}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PR Summary Tab */}
        {pr_scan_summary && (
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>PR Scan Summary</CardTitle>
                <CardDescription>Summary of issues found in this pull request</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Total Issues</label>
                    <p className="text-3xl font-bold mt-2">{pr_scan_summary.total_issues}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Security Issues</label>
                    <p className="text-3xl font-bold text-red-600 mt-2">{pr_scan_summary.security_issues}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Performance Issues</label>
                    <p className="text-3xl font-bold text-orange-600 mt-2">{pr_scan_summary.performance_issues}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Critical Issues</label>
                    <p className="text-3xl font-bold text-red-500 mt-2">{pr_scan_summary.critical_issues}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Open Comments</label>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">{pr_scan_summary.open_comments}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Resolved Comments</label>
                    <p className="text-3xl font-bold text-green-600 mt-2">{pr_scan_summary.resolved_comments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* PR Comments Tab */}
        <TabsContent value="comments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>PR Comments</CardTitle>
              <CardDescription>
                {pr_comments.length > 0 
                  ? `${pr_comments.length} comment${pr_comments.length !== 1 ? 's' : ''} found in this scan`
                  : 'No comments found for this scan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pr_comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No PR comments found for this automated run.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pr_comments.map((comment) => (
                    <Card key={comment.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{comment.issue_title}</CardTitle>
                              {getSeverityBadge(comment.severity)}
                              {getIssueTypeBadge(comment.issue_type)}
                              <Badge variant={comment.status === 'open' ? 'default' : 'secondary'}>
                                {comment.status}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span>{comment.file_path}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Code className="w-4 h-4" />
                                <span>Line {comment.line_number}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                <span>Comment #{comment.comment_id}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Issue Category</label>
                          <p className="mt-1">{comment.issue_category}</p>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Description</label>
                          <p className="mt-1 text-sm">{comment.issue_description}</p>
                        </div>

                        {comment.code_snippet && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Code Snippet</label>
                            <pre className="mt-1 p-3 bg-muted rounded-md text-sm overflow-x-auto">
                              <code>{comment.code_snippet}</code>
                            </pre>
                          </div>
                        )}

                        {comment.recommended_code && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Recommended Code</label>
                            <pre className="mt-1 p-3 bg-green-50 dark:bg-green-950 rounded-md text-sm overflow-x-auto">
                              <code>{comment.recommended_code}</code>
                            </pre>
                          </div>
                        )}

                        {comment.solution_code && (
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Solution Code</label>
                            <pre className="mt-1 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm overflow-x-auto">
                              <code>{comment.solution_code}</code>
                            </pre>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutomatedScanDetails;

