import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  GitBranch, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  RefreshCw,
  Filter,
  Eye,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";
import { useToast } from "@/hooks/use-toast";

interface AutomatedRun {
  id: string | number;
  repo_id?: string;
  repo_name?: string;
  repo_url?: string;
  status: 'Queued' | 'In Progress' | 'Completed' | 'Failed';
  trigger_type: 'webhook_push' | 'webhook_pr_created' | 'webhook_pr_updated';
  pr_id?: string;
  pr_number?: string;
  pr_title?: string;
  branch_name?: string;
  commit_sha?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  total_issues_found?: number;
  error_message?: string;
  analysis_run_id?: string;
  contributor_display_name?: string;
  contributor_username?: string;
}

const GitAutomatedScan = () => {
  const navigate = useNavigate();
  const { selectedPlatformId } = usePlatform();
  const { toast } = useToast();
  
  const [runs, setRuns] = useState<AutomatedRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Filters
  const [repoIdFilter, setRepoIdFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [triggerTypeFilter, setTriggerTypeFilter] = useState<string>("all");
  const [prIdFilter, setPrIdFilter] = useState("");
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const fetchAutomatedRuns = useCallback(async () => {
    if (!selectedPlatformId) {
      setError("No platform selected");
      setRuns([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const params: any = {
        platform_id: selectedPlatformId,
        page: page,
        page_size: pageSize,
      };

      if (repoIdFilter.trim()) params.repo_id = repoIdFilter.trim();
      if (statusFilter !== "all") params.status = statusFilter;
      if (triggerTypeFilter !== "all") params.trigger_type = triggerTypeFilter;
      if (prIdFilter.trim()) params.pr_id = prIdFilter.trim();

      const response = await apiService.getAutomatedRuns(params);
      
      // Handle both array and paginated responses
      let runsList: AutomatedRun[] = [];
      if (Array.isArray(response)) {
        runsList = response;
        setTotalCount(response.length);
        setHasNextPage(false);
        setHasPreviousPage(false);
      } else if (response.results && Array.isArray(response.results)) {
        runsList = response.results;
        setTotalCount(response.count || response.results.length);
        setHasNextPage(!!response.next);
        setHasPreviousPage(!!response.previous);
      } else {
        runsList = [];
        setTotalCount(0);
        setHasNextPage(false);
        setHasPreviousPage(false);
      }

      setRuns(runsList);
    } catch (err: any) {
      console.error("Error fetching automated runs:", err);
      setError(err.message || "Failed to load automated runs");
      setRuns([]);
      toast({
        title: "Error loading automated runs",
        description: err.message || "Failed to fetch automated runs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPlatformId, page, pageSize, repoIdFilter, statusFilter, triggerTypeFilter, prIdFilter, toast]);

  useEffect(() => {
    fetchAutomatedRuns();
  }, [fetchAutomatedRuns]);

  const handleResetFilters = () => {
    setRepoIdFilter("");
    setStatusFilter("all");
    setTriggerTypeFilter("all");
    setPrIdFilter("");
    setPage(1);
  };

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

  const formatDate = (dateString: string) => {
    try {
      // Fix malformed timezone format if present
      const fixedDateString = dateString.replace(/\+00:00Z$/, '+00:00');
      return new Date(fixedDateString).toLocaleString();
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const handleViewDetails = (run: AutomatedRun) => {
    if (run.repo_url) {
      const params = new URLSearchParams();
      params.set('repo_url', run.repo_url);
      if (run.analysis_run_id) {
        params.set('analysis_run_id', run.analysis_run_id);
      }
      const repoName = run.repo_name || 'repository';
      navigate(`/code-review-repos/${repoName}?${params.toString()}`);
    }
  };

  const hasActiveFilters = repoIdFilter.trim() !== "" || statusFilter !== "all" || triggerTypeFilter !== "all" || prIdFilter.trim() !== "";

  return (
    <div className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Git Automated Scan
            </h1>
            <p className="text-muted-foreground mt-2">
              View and manage automated scan runs triggered by webhooks
            </p>
          </div>
          <Button 
            onClick={fetchAutomatedRuns}
            variant="outline"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
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
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Total Runs</CardTitle>
            <GitBranch className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalCount}</div>
            <p className="text-xs text-blue-700 dark:text-blue-300">Automated scans</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {runs.filter(r => r.status === 'Completed').length}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300">Successful scans</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-orange-600 animate-spin" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {runs.filter(r => r.status === 'In Progress').length}
            </div>
            <p className="text-xs text-orange-700 dark:text-orange-300">Currently running</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900 dark:text-red-100">
              {runs.filter(r => r.status === 'Failed').length}
            </div>
            <p className="text-xs text-red-700 dark:text-red-300">Failed scans</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
            <CardDescription>
              Filter automated runs by repository, status, trigger type, or PR ID
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Repository ID</label>
                <Input
                  placeholder="Filter by repo ID"
                  value={repoIdFilter}
                  onChange={(e) => {
                    setRepoIdFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="Queued">Queued</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Trigger Type</label>
                <Select value={triggerTypeFilter} onValueChange={(value) => { setTriggerTypeFilter(value); setPage(1); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="All trigger types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trigger Types</SelectItem>
                    <SelectItem value="webhook_push">Push</SelectItem>
                    <SelectItem value="webhook_pr_created">PR Created</SelectItem>
                    <SelectItem value="webhook_pr_updated">PR Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">PR ID</label>
                <Input
                  placeholder="Filter by PR ID"
                  value={prIdFilter}
                  onChange={(e) => {
                    setPrIdFilter(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4">
                <Button variant="outline" onClick={handleResetFilters} size="sm">
                  Clear Filters
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Runs Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Automated Runs</CardTitle>
            <CardDescription>
              {loading ? 'Loading automated runs...' : `${totalCount} automated run${totalCount !== 1 ? 's' : ''} found`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading automated runs...</span>
              </div>
            ) : runs.length === 0 ? (
              <div className="text-center py-8">
                <GitBranch className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No automated runs found</h3>
                <p className="text-muted-foreground">
                  {hasActiveFilters 
                    ? "No runs match your filters. Try adjusting your search criteria." 
                    : "No automated scan runs have been recorded yet."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repository</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Trigger Type</TableHead>
                      <TableHead>Branch/PR</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead>Findings</TableHead>
                      <TableHead className="text-right">Contributors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow 
                        key={run.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`/automated-scan-details/${run.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">{run.repo_name || run.repo_url || 'Unknown'}</div>
                              {run.repo_url && (
                                <div className="text-xs text-muted-foreground">{run.repo_url}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(run.status)}
                        </TableCell>
                        <TableCell>
                          {getTriggerTypeBadge(run.trigger_type)}
                        </TableCell>
                        <TableCell>
                          {run.trigger_type === 'webhook_push' ? (
                            <div>
                              <div className="text-sm font-medium">{run.branch_name || 'N/A'}</div>
                              {run.commit_sha && (
                                <div className="text-xs text-muted-foreground font-mono">
                                  {run.commit_sha.substring(0, 7)}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium">
                                PR #{run.pr_number || run.pr_id || 'N/A'}
                              </div>
                              {run.pr_title && (
                                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                  {run.pr_title}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{formatDate(run.created_at)}</div>
                          {run.completed_at && run.status === 'Completed' && (
                            <div className="text-xs text-muted-foreground">
                              Completed: {formatDate(run.completed_at)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {run.total_issues_found !== undefined ? (
                            <span className="font-medium">{run.total_issues_found}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                              <div className="font-medium">{run.contributor_display_name || 'Unknown'}</div>
                              {run.contributor_username && (
                                <div className="text-xs text-muted-foreground">{run.contributor_username}</div>
                              )}
                            </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Pagination */}
      {!loading && runs.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} runs
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(page - 1)} 
              disabled={!hasPreviousPage || loading}
            >
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(page + 1)} 
              disabled={!hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GitAutomatedScan;

