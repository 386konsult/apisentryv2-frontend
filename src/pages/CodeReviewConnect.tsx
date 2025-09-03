import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link2, GitBranch, PlusCircle, ExternalLink, Settings, Users, Star, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  lastScan: string | null;
  risk: string;
  score: number | null;
  status: string;
  totalSuggestions: number;
  openSuggestions: number;
  resolvedSuggestions: number;
  owner?: {
    login: string;
    avatar_url: string;
  };
}

interface GitHubProfile {
  username: string;
  avatar_url: string;
  profile_url: string;
  name: string;
  installation_id: string | null;
  connected: boolean;
  platform_name?: string;
}

const CodeReviewConnect = () => {
  const { selectedPlatformId } = usePlatform();
  const [repos, setRepos] = useState<Repo[]>([]);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Fetch GitHub profile
  const fetchProfile = () => {
    if (!selectedPlatformId) {
      setProfileLoading(false);
      return;
    }
    
    setProfileLoading(true);
    const token = localStorage.getItem('auth_token');
    fetch(`${API_BASE_URL}/github/status/?platform_id=${selectedPlatformId}`, {
      method: "GET",
      credentials: "include",
      headers: token ? { 'Authorization': `Token ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        // Handle the actual API response structure
        if (data && typeof data === 'object') {
          if (data.connected === true) {
            // Profile is connected and has user data
            setProfile(data);
          
          } else {
            // Fallback case - treat as not connected
            setProfile({
              username: 'unknown',
              avatar_url: '',
              profile_url: '',
              name: 'GitHub App User',
              installation_id: null,
              connected: false,
              platform_name: 'Unknown Platform'
            });
          }
        }
        setProfileLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setProfileLoading(false);
      });
  };

  // Handle OAuth callback and GitHub App installation callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const installationId = urlParams.get("installation_id");
    const setupAction = urlParams.get("setup_action");

    if (installationId ) {
      // Handle GitHub App installation callback
      setLoading(true);
      if (!selectedPlatformId) {
        setError("No platform selected. Please select a platform first.");
        setSuccessMessage(""); // Clear success message
        setLoading(false);
        return;
      }
      
      // Call backend API to handle GitHub App installation
      fetch(`${API_BASE_URL}/github/installation/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(localStorage.getItem('auth_token') ? { 'Authorization': `Token ${localStorage.getItem('auth_token')}` } : {}),
        },
        body: JSON.stringify({
          installation_id: installationId,
          platform_id: selectedPlatformId,
          setup_action: setupAction
        }),
      })
        .then((res) => {
          if (res.status === 409) {
            // 409 Conflict - GitHub App already installed, fetch updated profile
            fetchProfile();
            fetchRepos(page);
            setError(""); // Clear any previous errors
            setSuccessMessage("GitHub App is already installed. Fetching updated status...");
            setTimeout(() => setSuccessMessage(""), 3000);
            return;
          }
          if (!res.ok) throw new Error("GitHub App installation failed");
          return res.json();
        })
        .then((data) => {
          if (data) { // Only proceed if we have data (not a 409 case)
            // After successful installation, fetch repos and profile
            fetchRepos(page);
            fetchProfile();
            setError(""); // Clear any previous errors
            setSuccessMessage("GitHub App installed successfully! Your repositories are now connected.");
            // Clear success message after 5 seconds
            setTimeout(() => setSuccessMessage(""), 5000);
          }
        })
        .catch(() => {
          setError("GitHub App installation failed. Please try again.");
          setSuccessMessage(""); // Clear success message
          setLoading(false);
        });
    } else {
      // If already authenticated, fetch repos and profile
      fetchRepos(page);
      fetchProfile();
    }
    // eslint-disable-next-line
  }, [page]);

  const fetchRepos = (pageNum: number) => {
    if (!selectedPlatformId) {
      setError("No platform selected. Please select a platform first.");
      setSuccessMessage(""); // Clear success message
      setLoading(false);
      return;
    }
    
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    fetch(`${API_BASE_URL}/github/repos/?page=${pageNum}&page_size=${pageSize}&platform_id=${selectedPlatformId}`, {
      method: "GET",
      credentials: "include",
      headers: token ? { 'Authorization': `Token ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch repos");
        return res.json();
      })
      .then((data) => {
        setRepos(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load repositories.");
        setSuccessMessage(""); // Clear success message
        setLoading(false);
      });
  };

  // Start GitHub App installation flow
  const handleConnectGitHub = () => {
    // Redirect to GitHub App installation page
    window.location.href = "https://github.com/apps/apisentry-ai/installations/select_target";
  };

  // Connect additional organizations via GitHub App installation
  const handleConnectOrganization = () => {
    // Always use GitHub App installation for consistency
    window.location.href = "https://github.com/apps/apisentry-ai/installations/select_target";
  };

  // Disconnect GitHub
  const handleDisconnectGitHub = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/auth/github/disconnect/?platform_id=${selectedPlatformId}`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      
      if (response.ok) {
        setProfile(null);
        setRepos([]);
        setError("");
        setSuccessMessage(""); // Clear success message
      } else {
        setError("Failed to disconnect GitHub");
        setSuccessMessage(""); // Clear success message
      }
    } catch (err) {
      setError("Error disconnecting GitHub");
      setSuccessMessage(""); // Clear success message
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Github Connect</h1>
          <p className="text-muted-foreground mt-2">Manage your GitHub App installation and view connected repositories</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleConnectGitHub}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {profile && profile.connected ? 'Update Installation' : 'Install GitHub App'}
          </Button>
          {profile && profile.connected && (
            <Dialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm GitHub Disconnection</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to disconnect the GitHub App? This action will:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Remove access to all connected repositories</p>
                    <p>• Stop code review and security scanning</p>
                    <p>• Require a new installation to reconnect</p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowDisconnectConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        setShowDisconnectConfirm(false);
                        handleDisconnectGitHub();
                      }}
                    >
                      Disconnect GitHub App
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* GitHub Connection Status */}
      {profileLoading ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Loading GitHub Status...</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : profile && profile.connected ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>GitHub Connected</span>
              </CardTitle>
              <CardDescription>Your GitHub account is successfully connected via GitHub App</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      ) :  (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>GitHub Not Connected</span>
              </CardTitle>
              <CardDescription>GitHub App is not installed for this platform</CardDescription>
            </CardHeader>
           
          </Card>
        </motion.div>
      ) }

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitBranch className="w-5 h-5 text-blue-600" />
                <span>Connected Repositories</span>
              </div>
              {repos.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {repos.length} {repos.length === 1 ? 'repository' : 'repositories'}
                </div>
              )}
            </CardTitle>
            <CardDescription>Repositories available for code review and security scanning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">

            {loading ? (
              <div className="text-muted-foreground flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading repositories...</span>
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No repositories found.</p>
                <p className="text-sm">Make sure you've installed the GitHub App and granted access to repositories.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {repos.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-200">
                    <div className="flex items-center space-x-3">
                      {/* Use a default avatar if owner.avatar_url is not available */}
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {repo.owner?.avatar_url ? (
                          <img src={repo.owner.avatar_url} alt={repo.owner.login || repo.name} className="w-8 h-8 rounded-full" />
                        ) : (
                          <GitBranch className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {repo.owner?.login ? `${repo.owner.login}/${repo.name}` : repo.full_name || repo.name}
                          </span>
                          {repo.private && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Private</span>}
                          {repo.language && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{repo.language}</span>}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">{repo.description}</p>
                        )}
                        {/* Display additional repository info */}
                        <div className="flex items-center space-x-2 mt-1">
                          {repo.risk && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              repo.risk === 'Low' ? 'bg-green-100 text-green-600' :
                              repo.risk === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                              repo.risk === 'High' ? 'bg-orange-100 text-orange-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {repo.risk} Risk
                            </span>
                          )}
                          {repo.score !== null && (
                            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                              Score: {repo.score}
                            </span>
                          )}
                          {repo.totalSuggestions > 0 && (
                            <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                              {repo.openSuggestions} open / {repo.totalSuggestions} total
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => window.open(repo.html_url, '_blank')}>
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {/* Pagination controls */}
            {repos.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Page {page}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1 || loading}>
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={repos.length < pageSize || loading}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewConnect;