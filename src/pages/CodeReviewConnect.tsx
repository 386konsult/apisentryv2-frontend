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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Link2, GitBranch, PlusCircle, ExternalLink, Settings, Users, Star, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";

type Provider = 'github' | 'bitbucket';

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

interface ProviderProfile {
  account_login?: string;
  account_type?: string;
  avatar_url?: string;
  profile_url?: string;
  installation_id?: string | null;
  connected: boolean;
  platform_name?: string;
  repositories_count?: number;
  repository_selection?: string;
}

const CodeReviewConnect = () => {
  const { selectedPlatformId } = usePlatform();
  const [provider, setProvider] = useState<Provider>('github');
  const [repos, setRepos] = useState<Repo[]>([]);
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Clear error and success messages after a delay
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Fetch provider profile (GitHub or Bitbucket)
  const fetchProfile = () => {
    if (!selectedPlatformId) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    
    setProfileLoading(true);
    setError("");
    
    const token = localStorage.getItem('auth_token');
    const providerName = provider === 'github' ? 'github' : 'bitbucket';
    fetch(`${API_BASE_URL}/${providerName}/status/?platform_id=${selectedPlatformId}`, {
      method: "GET",
      credentials: "include",
      headers: token ? { 'Authorization': `Token ${token}` } : {},
    })
      .then((res) => {
        if (res.status === 400) {
          throw new Error("Platform ID is required");
        }
        if (res.status === 404) {
          throw new Error("Platform not found");
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch profile: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setProfileLoading(false);
      })
      .catch((err) => {
        console.error(`Error fetching ${providerName} profile:`, err);
        setError(err.message || `Failed to fetch ${providerName === 'github' ? 'GitHub' : 'Bitbucket'} profile`);
        setProfile(null);
        setProfileLoading(false);
      });
  };

  // Handle GitHub App installation callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const installationId = urlParams.get("installation_id");
    const setupAction = urlParams.get("setup_action");

    // Handle GitHub App installation callback
    if (installationId && provider === 'github') {
      setLoading(true);
      setError("");
      
      if (!selectedPlatformId) {
        setError("No platform selected. Please select a platform first.");
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('auth_token');
      fetch(`${API_BASE_URL}/github/installation/`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { 'Authorization': `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          installation_id: installationId,
          platform_id: selectedPlatformId,
          setup_action: setupAction
        }),
      })
        .then((res) => {
          if (res.status === 409) {
            // 409 Conflict - GitHub App already installed
            setSuccessMessage("GitHub App is already installed. Fetching updated status...");
            fetchProfile();
            fetchRepos(page);
            setLoading(false);
            return null;
          }
          if (!res.ok) {
            throw new Error(`GitHub App installation failed: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          if (data) {
            setSuccessMessage("GitHub App installed successfully! Your repositories are now connected.");
            fetchRepos(page);
            fetchProfile();
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Installation error:", err);
          setError(err.message || "GitHub App installation failed. Please try again.");
          setLoading(false);
        });
    } else if (selectedPlatformId) {
      // Only fetch if we have a platform selected
      fetchRepos(page);
      fetchProfile();
    }
    // eslint-disable-next-line
  }, [selectedPlatformId, page, provider]);

  const fetchRepos = (pageNum: number) => {
    if (!selectedPlatformId) {
      setError("No platform selected. Please select a platform first.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError("");
    
    const token = localStorage.getItem('auth_token');
    const providerName = provider === 'github' ? 'github' : 'bitbucket';
    fetch(`${API_BASE_URL}/${providerName}/repos/?page=${pageNum}&page_size=${pageSize}&platform_id=${selectedPlatformId}`, {
      method: "GET",
      credentials: "include",
      headers: token ? { 'Authorization': `Token ${token}` } : {},
    })
      .then((res) => {
        if (res.status === 404) {
          // Silently handle 404, do not show error
          setRepos([]);
          setLoading(false);
          return null;
        }
        if (!res.ok) {
          throw new Error(`Failed to fetch repositories: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data) {
          // Handle both array response and paginated object response
          if (Array.isArray(data)) {
            setRepos(data);
          } else if (data.results && Array.isArray(data.results)) {
            // Paginated response with results array
            setRepos(data.results);
          } else {
            setRepos([]);
          }
        } else {
          setRepos([]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching repos:", err);
        // Only show error if not 404
        if (err.message !== "Failed to fetch repositories: 404") {
          setError(err.message || "Could not load repositories.");
        }
        setLoading(false);
      });
  };

  // Start provider connection flow
  const handleConnect = async () => {
    if (provider === 'github') {
      // GitHub App installation flow
      window.location.href = "https://github.com/apps/SmartComply Heimdall-ai/installations/select_target";
    } else if (provider === 'bitbucket') {
      // Bitbucket OAuth flow
      if (!selectedPlatformId) {
        setError("No platform selected");
        return;
      }
      
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(`${API_BASE_URL}/bitbucket/oauth/authorize/?platform_id=${selectedPlatformId}`, {
          method: 'GET',
          credentials: 'include',
          headers: token ? { 'Authorization': `Token ${token}` } : {},
        });
        
        if (response.ok) {
          const data = await response.json();
          // Handle both direct URL string or object with authorization_url/auth_url/url property
          const authUrl = typeof data === 'string' 
            ? data 
            : (data.authorization_url || data.auth_url || data.url);
          if (authUrl) {
            window.location.href = authUrl;
          } else {
            throw new Error("No authorization URL received");
          }
        } else {
          throw new Error(`Failed to initiate Bitbucket connection: ${response.status}`);
        }
      } catch (err: any) {
        console.error("Bitbucket connection error:", err);
        setError(err.message || "Error connecting to Bitbucket");
      }
    }
  };

  // Disconnect provider
  const handleDisconnect = async () => {
    if (!selectedPlatformId) {
      setError("No platform selected");
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const providerName = provider === 'github' ? 'github' : 'bitbucket';
      const response = await fetch(`${API_BASE_URL}/${providerName}/disconnect/?platform_id=${selectedPlatformId}`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      
      if (response.ok) {
        setProfile(null);
        setRepos([]);
        setError("");
        const providerDisplayName = provider === 'github' ? 'GitHub' : 'Bitbucket';
        setSuccessMessage(`Successfully disconnected from ${providerDisplayName}`);
      } else {
        throw new Error(`Failed to disconnect: ${response.status}`);
      }
    } catch (err) {
      console.error("Disconnect error:", err);
      const providerDisplayName = provider === 'github' ? 'GitHub' : 'Bitbucket';
      setError(`Error disconnecting ${providerDisplayName}`);
    }
  };

  // Update data when provider changes
  useEffect(() => {
    if (selectedPlatformId) {
      fetchRepos(page);
      fetchProfile();
    }
    // eslint-disable-next-line
  }, [provider]);

  // Show platform selection message if no platform is selected
  if (!selectedPlatformId) {
    return (
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-yellow-600" />
              <span>Platform Required</span>
            </CardTitle>
            <CardDescription>
              Please select a platform to manage repository connections.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const providerDisplayName = provider === 'github' ? 'GitHub' : 'Bitbucket';
  const providerColor = provider === 'github' 
    ? 'from-blue-600 to-purple-600' 
    : 'from-blue-500 to-blue-700';

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r bg-clip-text text-transparent" style={{
              backgroundImage: `linear-gradient(to right, ${provider === 'github' ? '#2563eb, #9333ea' : '#0052cc, #0065ff'})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Repository Connect
            </h1>
            <p className="text-muted-foreground mt-2">Connect your repositories for code review and security scanning</p>
          </div>
        </div>
        
        {/* Provider Selector Tabs */}
        <Tabs value={provider} onValueChange={(value) => setProvider(value as Provider)} className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="github">GitHub</TabsTrigger>
            <TabsTrigger value="bitbucket">Bitbucket</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex gap-2">
          <Button 
            onClick={handleConnect}
            className={`bg-gradient-to-r text-white ${
              provider === 'github' 
                ? 'from-blue-500 to-purple-500' 
                : 'from-blue-500 to-blue-700'
            }`}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            {profile?.connected 
              ? (provider === 'github' ? 'Update Installation' : 'Reconnect') 
              : (provider === 'github' ? 'Install GitHub App' : 'Connect Bitbucket')}
          </Button>
          {profile?.connected && (
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
                  <DialogTitle>Confirm {providerDisplayName} Disconnection</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to disconnect {providerDisplayName}? This action will:
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>• Remove access to all connected repositories</p>
                    <p>• Stop code review and security scanning</p>
                    <p>• Require a new connection to reconnect</p>
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
                        handleDisconnect();
                      }}
                    >
                      Disconnect {providerDisplayName}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </motion.div>

      {/* Success/Error Messages */}
      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800">
            <CardContent className="pt-4">
              <p className="text-green-700 dark:text-green-300 text-sm">{successMessage}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
            <CardContent className="pt-4">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Provider Connection Status */}
      {profileLoading ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>Loading {providerDisplayName} Status...</span>
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
      ) : profile?.connected ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{providerDisplayName} Connected</span>
              </CardTitle>
              <CardDescription>
                {provider === 'github' ? 'GitHub App is installed and connected' : 'Bitbucket is connected'}
                {profile.account_login && ` as ${profile.account_login}`}
                {profile.repositories_count && ` (${profile.repositories_count} repositories)`}
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>{providerDisplayName} Not Connected</span>
              </CardTitle>
              <CardDescription>
                {provider === 'github' 
                  ? 'GitHub App is not installed for this platform' 
                  : 'Bitbucket is not connected for this platform'}
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      )}

      {/* Repositories Section */}
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
                <p className="text-sm">
                  {provider === 'github' 
                    ? "Make sure you've installed the GitHub App and granted access to repositories."
                    : "Make sure you've connected Bitbucket and granted access to repositories."}
                </p>
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
