import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, Zap, Loader2, CheckCircle, AlertCircle, Clock, Building2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";

type Provider = 'github' | 'bitbucket';

interface Workspace {
  uuid: string;
  slug: string;
  name: string;
}

interface Repository {
  id: number | string; // Can be number (GitHub) or UUID string (Bitbucket)
  name: string;
  full_name: string;
  html_url: string;
  score?: number;
  risk?: "Low" | "Medium" | "High" | "Critical";
  lastScan?: string;
  scan_status?: "queued" | "in progress" | "completed" | "failed";
  scan_run_id?: string;
  status?: string;
  totalSuggestions?: number;
  openSuggestions?: number;
  resolvedSuggestions?: number;
}

interface ScanJob {
  analysis_run_id: string;
  status: string;
  repo_url: string;
  total_files_scanned?: number;
  total_issues?: number;
  created_at: string;
  completed_at?: string;
}

interface BatchScanJob {
  scan_batch_id: string;
  total_repositories: number;
  completed_repositories: number;
  failed_repositories: number;
  queued_repositories: number;
  total_issues_found: number;
  status: string;
}

const CodeReviewRepos = () => {
  const navigate = useNavigate();
  const [provider, setProvider] = useState<Provider>('github');
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [scanningRepos, setScanningRepos] = useState<Set<string>>(new Set());
  const [activeScanJobs, setActiveScanJobs] = useState<Map<string, ScanJob>>(new Map());
  const [batchScan, setBatchScan] = useState<BatchScanJob | null>(null);
  const [scanningAll, setScanningAll] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const { selectedPlatformId } = usePlatform();
  
  // Bitbucket workspace selection
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  // Fetch Bitbucket workspaces
  const fetchWorkspaces = async () => {
    if (provider !== 'bitbucket' || !selectedPlatformId) {
      setWorkspaces([]);
      return;
    }
    
    setLoadingWorkspaces(true);
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/bitbucket/workspaces/?platform_id=${selectedPlatformId}`, {
        method: "GET",
        credentials: "include",
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Handle response format: could be array, object with results, or object with workspaces + selected_workspace
        let workspacesList: Workspace[] = [];
        let backendSelectedWorkspace: string | null = null;
        
        if (Array.isArray(data)) {
          workspacesList = data;
        } else if (data.results && Array.isArray(data.results)) {
          workspacesList = data.results;
        } else if (data.workspaces && Array.isArray(data.workspaces)) {
          workspacesList = data.workspaces;
        }
        
        // Extract selected workspace from backend if provided
        if (data.selected_workspace) {
          backendSelectedWorkspace = data.selected_workspace.slug || data.selected_workspace.uuid || data.selected_workspace;
        } else if (data.selected_workspace_slug) {
          backendSelectedWorkspace = data.selected_workspace_slug;
        }
        
        setWorkspaces(workspacesList);
        
        // Use backend's selected workspace if available, otherwise auto-select first workspace
        if (backendSelectedWorkspace) {
          setSelectedWorkspace(backendSelectedWorkspace);
        } else if (workspacesList.length > 0 && !selectedWorkspace) {
          setSelectedWorkspace(workspacesList[0].slug || workspacesList[0].uuid);
        }
      } else {
        console.error("Failed to fetch workspaces:", response.status);
      }
    } catch (error) {
      console.error("Error fetching workspaces:", error);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const fetchRepos = useCallback(async () => {
    if (!selectedPlatformId) {
      setError("No platform selected");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    try {
      const providerName = provider === 'github' ? 'github' : 'bitbucket';
      let url = `${API_BASE_URL}/${providerName}/repos/?page=${page}&page_size=${pageSize}&platform_id=${selectedPlatformId}`;
      
      // Add workspace_slug parameter for Bitbucket
      if (provider === 'bitbucket' && selectedWorkspace) {
        url += `&workspace_slug=${encodeURIComponent(selectedWorkspace)}`;
      }
      
      const response = await fetch(url, {
        method: "GET",
        credentials: "include",
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      
      if (!response.ok) throw new Error("Failed to fetch repos");
      
      const data = await response.json();
      // Handle both array and paginated responses
      if (Array.isArray(data)) {
        setRepos(data);
      } else if (data.results && Array.isArray(data.results)) {
        setRepos(data.results);
      } else {
        setRepos([]);
      }
      setError("");
    } catch (error) {
      console.error("Error fetching repos:", error);
      setError("Could not load repositories.");
    } finally {
      setLoading(false);
    }
  }, [selectedPlatformId, provider, page, pageSize, selectedWorkspace]);

  // Poll scan status for active jobs
  const pollScanStatus = useCallback(async (analysisRunId: string) => {
    const token = localStorage.getItem('auth_token');
    const providerName = provider === 'github' ? 'github' : 'bitbucket';
    try {
      const response = await fetch(`${API_BASE_URL}/${providerName}/scan-status/${analysisRunId}/`, {
        method: "GET",
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      
      if (!response.ok) return null;
      
      const scanJob: ScanJob = await response.json();
      
      // Update scan job in map
      setActiveScanJobs(prev => {
        const updated = new Map(prev);
        updated.set(analysisRunId, scanJob);
        return updated;
      });
      
      // If completed or failed, remove from active scans and refresh repos
      if (scanJob.status === 'completed' || scanJob.status === 'failed') {
        setActiveScanJobs(prev => {
          const updated = new Map(prev);
          updated.delete(analysisRunId);
          return updated;
        });
        
        setScanningRepos(prev => {
          const updated = new Set(prev);
          updated.delete(scanJob.repo_url);
          return updated;
        });
        
        // Refresh repos to get updated data
        fetchRepos();
      }
      
      return scanJob;
    } catch (error) {
      console.error("Error polling scan status:", error);
      return null;
    }
  }, [provider]);

  // Poll batch scan status
  const pollBatchScanStatus = useCallback(async (batchId: string) => {
    const token = localStorage.getItem('auth_token');
    const providerName = provider === 'github' ? 'github' : 'bitbucket';
    try {
      const response = await fetch(`${API_BASE_URL}/${providerName}/batch-scan-status/${batchId}/?platform_id=${selectedPlatformId}`, {
        method: "GET",
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      
      if (!response.ok) return null;
      
      const batchJob: BatchScanJob = await response.json();
      setBatchScan(batchJob);
      
      // If completed, stop polling and refresh repos
      if (batchJob.status === 'completed') {
        setBatchScan(null);
        setScanningAll(false);
        fetchRepos();
      }
      
      return batchJob;
    } catch (error) {
      console.error("Error polling batch scan status:", error);
      return null;
    }
  }, [selectedPlatformId, provider]);

  // Polling disabled - using manual scan alerts instead
  // Set up polling intervals
  // useEffect(() => {
  //   const intervals: NodeJS.Timeout[] = [];
  //   
  //   // Poll individual scan jobs
  //   activeScanJobs.forEach((_, analysisRunId) => {
  //     const interval = setInterval(() => {
  //       pollScanStatus(analysisRunId);
  //     }, 3000); // Poll every 3 seconds
  //     intervals.push(interval);
  //   });
  //   
  //   // Poll batch scan if active
  //   if (batchScan) {
  //     const batchInterval = setInterval(() => {
  //       pollBatchScanStatus(batchScan.scan_batch_id);
  //     }, 5000); // Poll every 5 seconds
  //     intervals.push(batchInterval);
  //   }
  //   
  //   // Cleanup intervals
  //   return () => {
  //     intervals.forEach(interval => clearInterval(interval));
  //   };
  // }, [activeScanJobs, batchScan, pollScanStatus, pollBatchScanStatus]);

  // Fetch workspaces when provider changes to Bitbucket
  useEffect(() => {
    if (provider === 'bitbucket' && selectedPlatformId) {
      fetchWorkspaces();
    } else {
      setWorkspaces([]);
      setSelectedWorkspace("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider, selectedPlatformId]);

  // Fetch repos when dependencies change
  useEffect(() => {
    if (provider === 'bitbucket' && !selectedWorkspace) {
      // Don't fetch repos if no workspace selected for Bitbucket
      setRepos([]);
      return;
    }
    fetchRepos();
  }, [fetchRepos, provider, selectedWorkspace]);

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">{risk} Risk</Badge>;
      case 'Medium':
        return <Badge className="bg-orange-100 text-orange-800">{risk} Risk</Badge>;
      case 'High':
        return <Badge className="bg-red-100 text-red-800">{risk} Risk</Badge>;
      case 'Critical':
        return <Badge className="bg-red-500 text-white">{risk} Risk</Badge>;
      default:
        return <Badge variant="secondary">{risk || "Unknown"} Risk</Badge>;
    }
  };

  const getScanStatusBadge = (scanJob: ScanJob) => {
    switch (scanJob.status) {
      case 'queued':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Queued
          </Badge>
        );
      case 'in progress':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Processing
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Processed
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{scanJob.status}</Badge>;
    }
  };

  const getRepoScanStatusBadge = (scanStatus?: string) => {
    if (!scanStatus) return null;
    
    switch (scanStatus) {
      case 'queued':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Scan Queued
          </Badge>
        );
      case 'in progress':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Scanning
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Scan Complete
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            Scan Failed
          </Badge>
        );
      default:
        return <Badge variant="secondary">{scanStatus}</Badge>;
    }
  };

  // Helper to persist and restore active scan jobs using analysis_run_id in localStorage
  const SCAN_JOBS_STORAGE_KEY = "active_scan_jobs";

  function saveActiveScanJobIds(ids: string[]) {
    localStorage.setItem(SCAN_JOBS_STORAGE_KEY, JSON.stringify(ids));
  }

  function loadActiveScanJobIds(): string[] {
    try {
      const raw = localStorage.getItem(SCAN_JOBS_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  // Manual scan alert - sends email notification for manual processing
  const handleScan = async (repo: Repository) => {
    setScanningRepos(prev => new Set(prev).add(repo.html_url));
    const token = localStorage.getItem('auth_token');
    try {
      if (!selectedPlatformId) {
        throw new Error('No platform selected');
      }
      
      const response = await fetch(`${API_BASE_URL}/admin/manual-scan-alert/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ 
          repo_urls: [repo.html_url],
          platform_id: selectedPlatformId
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.message || 'Scan initiation failed');
      }

      const result = await response.json();
      
      // Show success message
      setError("");
      setSuccessMessage(`Scan request submitted for ${repo.name}. You will receive an email notification when the scan is complete.`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      
      // Remove from scanning set after a short delay
      setTimeout(() => {
        setScanningRepos(prev => {
          const newSet = new Set(prev);
          newSet.delete(repo.html_url);
          return newSet;
        });
      }, 2000);

    } catch (error: any) {
      console.error("Scan error:", error);
      setError(error.message || "Failed to initiate scan. Please try again.");
      setScanningRepos(prev => {
        const newSet = new Set(prev);
        newSet.delete(repo.html_url);
        return newSet;
      });
    }
  };

  const handleScanAll = async () => {
    setScanningAll(true);
    const token = localStorage.getItem('auth_token');
    const providerName = provider === 'github' ? 'github' : 'bitbucket';
    try {
      if (!selectedPlatformId) {
        throw new Error('No platform selected');
      }

      let url = `${API_BASE_URL}/${providerName}/scan-all/?platform_id=${selectedPlatformId}`;
      
      // Add workspace parameter for Bitbucket (uses workspace slug)
      if (provider === 'bitbucket' && selectedWorkspace) {
        url += `&workspace=${encodeURIComponent(selectedWorkspace)}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Batch scan initiation failed');
      }
      
      const result = await response.json();
      
      // Call manual scan alert endpoint for both GitHub and Bitbucket
      const repoUrls = repos.map(repo => repo.html_url);
      if (repoUrls.length > 0) {
        try {
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
        } catch (alertError) {
          // Log but don't fail the scan if alert fails
          console.error("Manual scan alert error:", alertError);
        }
      }
      
      // Set up batch scan tracking
      setBatchScan({
        scan_batch_id: result.scanId,
        total_repositories: result.totalRepositoriesQueued,
        completed_repositories: 0,
        failed_repositories: 0,
        queued_repositories: result.totalRepositoriesQueued,
        total_issues_found: 0,
        status: 'in_progress'
      });
      
    } catch (error) {
      console.error("Batch scan error:", error);
      setError("Failed to initiate batch scan. Please try again.");
      setScanningAll(false);
    }
  };

  const getRepoScanJob = (repoUrl: string): ScanJob | undefined => {
    for (const [_, scanJob] of activeScanJobs) {
      if (scanJob.repo_url === repoUrl) {
        return scanJob;
      }
    }
    return undefined;
  };

  // Add statusCounts for scan jobs
  const statusCounts = { queued: 0, 'in progress': 0, completed: 0, failed: 0 };
  activeScanJobs.forEach(job => {
    statusCounts[job.status] = (statusCounts[job.status] || 0) + 1;
  });

  // Restore scan jobs disabled - using manual scan alerts instead
  // Restore scan jobs on mount/page change using analysis_run_id from storage
  // useEffect(() => {
  //   const restoreActiveScanJobs = async () => {
  //     const ids = loadActiveScanJobIds();
  //     if (!ids.length) return;
  //     const token = localStorage.getItem('auth_token');
  //     const providerName = provider === 'github' ? 'github' : 'bitbucket';
  //     const scanJobsMap = new Map<string, ScanJob>();
  //     const scanningReposSet = new Set<string>();
  //     await Promise.all(
  //       ids.map(async (analysisRunId) => {
  //         try {
  //           const resp = await fetch(`${API_BASE_URL}/${providerName}/scan-status/${analysisRunId}/`, {
  //             method: "GET",
  //             headers: token ? { 'Authorization': `Token ${token}` } : {},
  //           });
  //           if (!resp.ok) return;
  //           const scanJob: ScanJob = await resp.json();
  //           scanJobsMap.set(analysisRunId, scanJob);
  //           if (scanJob.status === 'queued' || scanJob.status === 'in progress') {
  //             scanningReposSet.add(scanJob.repo_url);
  //           }
  //         } catch {
  //           // ignore errors
  //         }
  //       })
  //     );
  //     setActiveScanJobs(scanJobsMap);
  //     setScanningRepos(scanningReposSet);
  //   };
  //   restoreActiveScanJobs();
  // }, [page, pageSize, selectedPlatformId, provider]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Repositories</h1>
            <p className="text-muted-foreground mt-2">View and manage all connected repositories for code review</p>
          </div>
          <Button 
            onClick={handleScanAll}
            disabled={true}
            // disabled={scanningAll || batchScan !== null || (provider === 'bitbucket' && !selectedWorkspace)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
          >
            {scanningAll || batchScan ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scanning All...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Scan All Repositories
              </>
            )}
          </Button>
        </div>
        
        {/* Provider Selector Tabs */}
        <Tabs value={provider} onValueChange={(value) => setProvider(value as Provider)} className="mb-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="bitbucket">Bitbucket</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Bitbucket Workspace Selector */}
        {provider === 'bitbucket' && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Workspace:</span>
                </div>
                {loadingWorkspaces ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Loading workspaces...</span>
                  </div>
                ) : workspaces.length > 0 ? (
                  <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
                    <SelectTrigger className="w-[300px]">
                      <SelectValue placeholder="Select a workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspaces.map((workspace) => (
                        <SelectItem key={workspace.uuid || workspace.slug} value={workspace.slug || workspace.uuid}>
                          {workspace.name || workspace.slug}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-sm text-muted-foreground">No workspaces available</span>
                )}
              </div>
              {provider === 'bitbucket' && !selectedWorkspace && workspaces.length > 0 && (
                <p className="text-xs text-yellow-600 mt-2">Please select a workspace to view repositories</p>
              )}
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Batch Scan Progress */}
      {batchScan && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-blue-900">Batch Scan Progress</h3>
                <Badge className="bg-blue-100 text-blue-800">
                  {batchScan.completed_repositories + batchScan.failed_repositories} / {batchScan.total_repositories}
                </Badge>
              </div>
              <Progress 
                value={(batchScan.completed_repositories + batchScan.failed_repositories) / batchScan.total_repositories * 100} 
                className="mb-2"
              />
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-blue-600 font-medium">Completed:</span> {batchScan.completed_repositories}
                </div>
                <div>
                  <span className="text-red-600 font-medium">Failed:</span> {batchScan.failed_repositories}
                </div>
                <div>
                  <span className="text-orange-600 font-medium">Queued:</span> {batchScan.queued_repositories}
                </div>
                <div>
                  <span className="text-green-600 font-medium">Issues Found:</span> {batchScan.total_issues_found}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {successMessage && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="w-4 h-4" />
                {successMessage}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
     
      <motion.div initial="hidden" animate="visible" variants={{hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:0.1}}}} className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Loading repositories...</p>
              <p className="text-sm text-muted-foreground">Please wait while we fetch your data</p>
            </div>
          </div>
        ) : repos.length === 0 ? (
          <Card className="p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <GitBranch className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                No repositories found
              </h3>
            </div>
          </Card>
        ) : (
          repos.map((repo) => {
            const repoScanJob = getRepoScanJob(repo.html_url);
            const isScanning = scanningRepos.has(repo.html_url) || repoScanJob !== undefined;
            
            // Disable scan button if scan is queued or in progress (only allow when failed, completed, or no scan status)
            const isScanInProgress = repo.scan_status === 'queued' || repo.scan_status === 'in progress';
            const canScan = !isScanInProgress && !isScanning && batchScan === null;
            
            return (
              <motion.div key={repo.id || repo.name} variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
                <Card className="p-4">
                  <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <div className="flex items-center space-x-3">
                      <GitBranch className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle className="text-xl font-semibold">{repo.name}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          Last run: {repo.lastScan || "N/A"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Show scan status badge if available, otherwise show risk badge */}
                      {repo.scan_status ? getRepoScanStatusBadge(repo.scan_status) : (repoScanJob ? getScanStatusBadge(repoScanJob) : getRiskBadge(repo.risk))}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          onClick={() => handleScan(repo)}
                          disabled={!canScan}
                        >
                          {isScanning ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Scanning...
                            </>
                          ) : isScanInProgress ? (
                            <>
                              <Clock className="w-4 h-4 mr-2" />
                              Scan In Progress
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 mr-2" />
                              Scan
                            </>
                          )}
                        </Button>
                        <Button variant="outline" onClick={() => navigate(`/code-review-repos/${repo.name}?repo_url=${repo.html_url}`)}>
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Total Suggestions</span>
                        <span className="text-2xl font-bold text-blue-600">
                          {repoScanJob?.total_issues ?? repo.totalSuggestions ?? 0}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Open Suggestions</span>
                        <span className="text-2xl font-bold text-orange-600">{repo.openSuggestions ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">Resolved Suggestions</span>
                        <span className="text-2xl font-bold text-green-600">{repo.resolvedSuggestions ?? 0}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-muted-foreground">
                          {repoScanJob ? 'Files Scanned' : 'Security Score'}
                        </span>
                        <span className="text-2xl font-bold text-purple-600">
                          {repoScanJob?.total_files_scanned ?? repo.score ?? 0}
                        </span>
                      </div>
                    </div>
                    
                    {/* Show scan progress for individual repositories */}
                    {repoScanJob && repoScanJob.status === 'in progress' && (
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                          <span>Scanning files...</span>
                          <span>{repoScanJob.total_files_scanned || 0} files processed</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{width: '45%'}}></div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </motion.div>
      
      {/* Pagination controls */}
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1 || loading}>Prev</Button>
        <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={repos.length < pageSize || loading}>Next</Button>
      </div>
    </div>
  );
};

export default CodeReviewRepos;