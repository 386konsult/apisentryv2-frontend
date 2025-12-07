import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Loader2, Settings } from 'lucide-react';
import { apiService } from '@/services/api';
import { usePlatform } from '@/contexts/PlatformContext';

interface RepositoryScanConfigProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  repoId?: string;
  repoUrl?: string;
  repoName: string;
  branches?: string[];
}

interface ScanConfig {
  scan_on_push: boolean;
  scan_on_pr_created: boolean;
  scan_on_pr_updated: boolean;
  push_scan_branches: string[];
  pr_target_branches: string[];
  auto_post_comments: boolean;
  min_severity_for_comments: 'critical' | 'high' | 'medium' | 'low';
  is_active?: boolean;
}

export function RepositoryScanConfig({
  open,
  onOpenChange,
  repoId,
  repoUrl,
  repoName,
  branches = []
}: RepositoryScanConfigProps): JSX.Element {
  const { selectedPlatformId } = usePlatform();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [config, setConfig] = useState<ScanConfig>({
    scan_on_push: true,
    scan_on_pr_created: true,
    scan_on_pr_updated: true,
    push_scan_branches: [],
    pr_target_branches: [],
    auto_post_comments: true,
    min_severity_for_comments: 'medium',
    is_active: false
  });

  const [pushBranchInput, setPushBranchInput] = useState('');
  const [prBranchInput, setPrBranchInput] = useState('');

  const fetchCurrentConfig = useCallback(async () => {
    if (!selectedPlatformId || (!repoId && !repoUrl)) return;
    
    setFetching(true);
    setError(null);
    try {
      // Clean repo_id if it has curly brackets
      const cleanedRepoId = repoId ? repoId.replace(/[{}]/g, '') : undefined;
      const currentConfig = await apiService.getRepositoryScanConfig(
        cleanedRepoId || '', 
        selectedPlatformId, 
        repoUrl
      );
      if (currentConfig) {
        setConfig({
          scan_on_push: currentConfig.scan_on_push ?? true,
          scan_on_pr_created: currentConfig.scan_on_pr_created ?? true,
          scan_on_pr_updated: currentConfig.scan_on_pr_updated ?? true,
          push_scan_branches: currentConfig.push_scan_branches || [],
          pr_target_branches: currentConfig.pr_target_branches || [],
          auto_post_comments: currentConfig.auto_post_comments ?? true,
          min_severity_for_comments: currentConfig.min_severity_for_comments || 'medium',
          is_active: currentConfig.is_active ?? false
        });
      }
    } catch (err: any) {
      // If config doesn't exist, that's okay - use defaults
      console.log('No existing config found, using defaults');
    } finally {
      setFetching(false);
    }
  }, [repoId, repoUrl, selectedPlatformId]);

  // Fetch current configuration when dialog opens
  useEffect(() => {
    if (open && selectedPlatformId && (repoId || repoUrl)) {
      fetchCurrentConfig();
    }
  }, [open, repoId, repoUrl, selectedPlatformId, fetchCurrentConfig]);

  const handleSave = async () => {
    if (!selectedPlatformId) {
      setError('No platform selected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Clean repo_id if it has curly brackets, or use repo_url if repo_id doesn't exist
      const cleanedRepoId = repoId ? repoId.replace(/[{}]/g, '') : undefined;
      const payload: any = {
        platform_id: selectedPlatformId,
        scan_on_push: config.scan_on_push,
        scan_on_pr_created: config.scan_on_pr_created,
        scan_on_pr_updated: config.scan_on_pr_updated,
        push_scan_branches: config.push_scan_branches,
        pr_target_branches: config.pr_target_branches,
        auto_post_comments: config.auto_post_comments,
        min_severity_for_comments: config.min_severity_for_comments
      };
      
      // Add repo_id or repo_url based on what's available
      if (cleanedRepoId) {
        payload.repo_id = cleanedRepoId;
      }
      if (repoUrl) {
        payload.repo_url = repoUrl;
      }
      
      await apiService.activateRepositoryScan(payload);

      setSuccess('Repository scan configuration saved successfully!');
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedPlatformId) {
      setError('No platform selected');
      return;
    }

    if (!confirm('Are you sure you want to deactivate automated scanning for this repository?')) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Clean repo_id if it has curly brackets, or use repo_url if repo_id doesn't exist
      const cleanedRepoId = repoId ? repoId.replace(/[{}]/g, '') : undefined;
      const payload: any = {
        platform_id: selectedPlatformId
      };
      
      // Add repo_id or repo_url based on what's available
      if (cleanedRepoId) {
        payload.repo_id = cleanedRepoId;
      }
      if (repoUrl) {
        payload.repo_url = repoUrl;
      }
      
      await apiService.deactivateRepositoryScan(payload);

      setSuccess('Automated scanning deactivated successfully!');
      setConfig(prev => ({ ...prev, is_active: false }));
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(null);
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to deactivate scanning');
    } finally {
      setLoading(false);
    }
  };

  const addPushBranch = () => {
    const branch = pushBranchInput.trim();
    if (branch && !config.push_scan_branches.includes(branch)) {
      setConfig(prev => ({
        ...prev,
        push_scan_branches: [...prev.push_scan_branches, branch]
      }));
      setPushBranchInput('');
    }
  };

  const removePushBranch = (branch: string) => {
    setConfig(prev => ({
      ...prev,
      push_scan_branches: prev.push_scan_branches.filter(b => b !== branch)
    }));
  };

  const addPrBranch = () => {
    const branch = prBranchInput.trim();
    if (branch && !config.pr_target_branches.includes(branch)) {
      setConfig(prev => ({
        ...prev,
        pr_target_branches: [...prev.pr_target_branches, branch]
      }));
      setPrBranchInput('');
    }
  };

  const removePrBranch = (branch: string) => {
    setConfig(prev => ({
      ...prev,
      pr_target_branches: prev.pr_target_branches.filter(b => b !== branch)
    }));
  };

  const selectBranchFromList = (type: 'push' | 'pr', branch: string) => {
    if (type === 'push') {
      if (!config.push_scan_branches.includes(branch)) {
        setConfig(prev => ({
          ...prev,
          push_scan_branches: [...prev.push_scan_branches, branch]
        }));
      }
    } else {
      if (!config.pr_target_branches.includes(branch)) {
        setConfig(prev => ({
          ...prev,
          pr_target_branches: [...prev.pr_target_branches, branch]
        }));
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Automated Scan Configuration
          </DialogTitle>
          <DialogDescription>
            Configure automated scanning for <strong>{repoName}</strong>
          </DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading configuration...</span>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
              </div>
            )}

            {/* Scan Triggers Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Scan Triggers</h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="scan-on-push">Scan on Push</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically scan when code is pushed to the repository
                  </p>
                </div>
                <Switch
                  id="scan-on-push"
                  checked={config.scan_on_push}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, scan_on_push: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="scan-on-pr-created">Scan on PR Created</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically scan when a pull request is created
                  </p>
                </div>
                <Switch
                  id="scan-on-pr-created"
                  checked={config.scan_on_pr_created}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, scan_on_pr_created: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="scan-on-pr-updated">Scan on PR Updated</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically scan when a pull request is updated
                  </p>
                </div>
                <Switch
                  id="scan-on-pr-updated"
                  checked={config.scan_on_pr_updated}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, scan_on_pr_updated: checked }))
                  }
                />
              </div>
            </div>

            {/* Branch Configuration Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">Branch Configuration</h3>

              {/* Push Scan Branches */}
              <div className="space-y-2">
                <Label>Push Scan Branches</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select branches to scan on push. Leave empty to scan all branches.
                </p>
                
                <div className="flex gap-2">
                  {branches.length > 0 ? (
                    <Select onValueChange={(value) => selectBranchFromList('push', value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <Input
                    placeholder="Enter branch name"
                    value={pushBranchInput}
                    onChange={(e) => setPushBranchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPushBranch();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addPushBranch} variant="outline" size="sm">
                    Add
                  </Button>
                </div>

                {config.push_scan_branches.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.push_scan_branches.map((branch) => (
                      <Badge key={branch} variant="secondary" className="flex items-center gap-1">
                        {branch}
                        <button
                          onClick={() => removePushBranch(branch)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {config.push_scan_branches.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">All branches will be scanned</p>
                )}
              </div>

              {/* PR Target Branches */}
              <div className="space-y-2">
                <Label>PR Target Branches</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Select target branches for PR scans. Leave empty to scan PRs targeting any branch.
                </p>
                
                <div className="flex gap-2">
                  {branches.length > 0 ? (
                    <Select onValueChange={(value) => selectBranchFromList('pr', value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch} value={branch}>
                            {branch}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  <Input
                    placeholder="Enter branch name"
                    value={prBranchInput}
                    onChange={(e) => setPrBranchInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addPrBranch();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button type="button" onClick={addPrBranch} variant="outline" size="sm">
                    Add
                  </Button>
                </div>

                {config.pr_target_branches.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.pr_target_branches.map((branch) => (
                      <Badge key={branch} variant="secondary" className="flex items-center gap-1">
                        {branch}
                        <button
                          onClick={() => removePrBranch(branch)}
                          className="ml-1 hover:bg-muted rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                {config.pr_target_branches.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">PRs targeting any branch will be scanned</p>
                )}
              </div>
            </div>

            {/* Comment Settings Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold">PR Comment Settings</h3>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-post-comments">Auto-post Comments</Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically post scan results as comments on pull requests
                  </p>
                </div>
                <Switch
                  id="auto-post-comments"
                  checked={config.auto_post_comments}
                  onCheckedChange={(checked) =>
                    setConfig(prev => ({ ...prev, auto_post_comments: checked }))
                  }
                />
              </div>

              {config.auto_post_comments && (
                <div className="space-y-2">
                  <Label htmlFor="min-severity">Minimum Severity for Comments</Label>
                  <Select
                    value={config.min_severity_for_comments}
                    onValueChange={(value: 'critical' | 'high' | 'medium' | 'low') =>
                      setConfig(prev => ({ ...prev, min_severity_for_comments: value }))
                    }
                  >
                    <SelectTrigger id="min-severity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only findings with this severity or higher will be posted as comments
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {config.is_active && (
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  'Deactivate'
                )}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

