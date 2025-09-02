import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, GitBranch, PlusCircle, ExternalLink, Settings, Users, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/services/api";

interface Repo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  owner: {
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
}

const CodeReviewConnect = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  // Fetch GitHub profile
  const fetchProfile = () => {
    setProfileLoading(true);
    const token = localStorage.getItem('auth_token');
    fetch(`${API_BASE_URL}/github/status/`, {
      method: "GET",
      credentials: "include",
      headers: token ? { 'Authorization': `Token ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch profile");
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        setProfileLoading(false);
      })
      .catch(() => {
        setProfile(null);
        setProfileLoading(false);
      });
  };

  // Handle OAuth callback and fetch repos
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      setLoading(true);
      // Backend will handle the code and set session/cookie
      const platformId = localStorage.getItem('selected_platform_id');
      fetch(`${API_BASE_URL}/auth/github/callback/?code=${code}&platform_uuid=${platformId}`, {
        method: "GET",
        credentials: "include",
      })
        .then((res) => {
          if (!res.ok) throw new Error("GitHub OAuth failed");
          return res.json();
        })
        .then(() => {
          // After OAuth, fetch repos and profile
          fetchRepos(page);
          fetchProfile();
        })
        .catch(() => {
          setError("GitHub authentication failed.");
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
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    fetch(`${API_BASE_URL}/github/repos/basic/?page=${pageNum}&page_size=${pageSize}`, {
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
        setLoading(false);
      });
  };

  // Start OAuth flow via backend (for first time connection or when disconnected)
  const handleConnectGitHub = () => {
    window.location.href = `${API_BASE_URL}/auth/github/login/?action=authorize`;
  };

  // Connect additional organizations via OAuth (when already connected)
  const handleConnectOrganization = () => {
    if (profile && profile.connected) {
      // If already connected, use install action for GitHub App installation
      window.location.href = `${API_BASE_URL}/auth/github/login/?action=install`;
    } else {
      // If not connected, use authorize action for OAuth
      window.location.href = `${API_BASE_URL}/auth/github/login/?action=authorize`;
    }
  };

  // Disconnect GitHub
  const handleDisconnectGitHub = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/auth/github/disconnect/`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { 'Authorization': `Token ${token}` } : {},
      });
      
      if (response.ok) {
        setProfile(null);
        setRepos([]);
        setError("");
      } else {
        setError("Failed to disconnect GitHub");
      }
    } catch (err) {
      setError("Error disconnecting GitHub");
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Connect Repository</h1>
          <p className="text-muted-foreground mt-2">Connect your GitHub repositories for automated code review and security scanning</p>
        </div>
      </motion.div>

      {/* GitHub Profile Section - only show if actually connected */}
      {profile && profile.connected && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-950 dark:to-blue-950 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>GitHub Connected</span>
              </CardTitle>
              <CardDescription>Your GitHub account is successfully connected</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img src={profile.avatar_url} alt={profile.username} className="w-12 h-12 rounded-full border-2 border-green-200" />
                  <div>
                    <h3 className="font-semibold text-lg">{profile.name || profile.username}</h3>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(profile.profile_url, '_blank')}>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                  <Button variant="destructive" size="sm" onClick={handleDisconnectGitHub}>
                    <Link2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Disconnected GitHub Profile Section */}
      {profile && !profile.connected && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>GitHub Disconnected</span>
              </CardTitle>
              <CardDescription>Your GitHub profile exists but connection is not active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <img src={profile.avatar_url} alt={profile.username} className="w-12 h-12 rounded-full border-2 border-yellow-200" />
                  <div>
                    <h3 className="font-semibold text-lg">{profile.name || profile.username}</h3>
                    <p className="text-muted-foreground">@{profile.username}</p>
                    <p className="text-xs text-yellow-600">Connection inactive</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button onClick={handleConnectGitHub} size="sm" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Reconnect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Connect GitHub card if no profile */}
      {(!profileLoading && !profile) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link2 className="w-5 h-5 text-blue-600" />
                <span>Connect GitHub</span>
              </CardTitle>
              <CardDescription>Authenticate with GitHub to enable repository scanning and code review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Button onClick={handleConnectGitHub} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white" disabled={loading}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Connect GitHub Account
                  </Button>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Star className="w-4 h-4 mr-1" />
                    <span>Secure OAuth flow</span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Settings className="w-4 h-4 mr-1" />
                    <span>Manage permissions</span>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <strong>What happens next:</strong><br />
                1. You'll be redirected to GitHub for authorization<br />
                2. Grant access to your repositories<br />
                3. Select which repositories to include for scanning
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Management Section for connected users only */}
      {profile && profile.connected && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-blue-600" />
                <span>GitHub App Management</span>
              </CardTitle>
              <CardDescription>Manage GitHub App installations and OAuth connections</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Connection</h4>
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>OAuth connected as @{profile.username}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">OAuth access granted for repositories</p>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Install GitHub App</h4>
                  <Button variant="outline" size="sm" onClick={handleConnectOrganization} className="w-full">
                    <Users className="w-4 h-4 mr-2" />
                    Install in Organization
                  </Button>
                  <p className="text-xs text-muted-foreground">Install GitHub App for enhanced repository access</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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
            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-950 p-3 rounded-lg border border-red-200 dark:border-red-800">
                {error}
              </div>
            )}
            {loading ? (
              <div className="text-muted-foreground flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading repositories...</span>
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No repositories found.</p>
                <p className="text-sm">Make sure you've granted access to repositories during OAuth.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {repos.map((repo) => (
                  <div key={repo.id} className="flex items-center justify-between p-3 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-200">
                    <div className="flex items-center space-x-3">
                      <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-8 h-8 rounded-full" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-blue-700 dark:text-blue-300">{repo.owner.login}/{repo.name}</span>
                          {repo.private && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">Private</span>}
                          {repo.language && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">{repo.language}</span>}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">{repo.description}</p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.open(repo.html_url, '_blank')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
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