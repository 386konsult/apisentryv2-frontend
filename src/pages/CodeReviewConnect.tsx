import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, GitBranch, PlusCircle } from "lucide-react";
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

const CodeReviewConnect = () => {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

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
          // After OAuth, fetch repos
          fetchRepos(page);
        })
        .catch(() => {
          setError("GitHub authentication failed.");
          setLoading(false);
        });
    } else {
      // If already authenticated, fetch repos
      fetchRepos(page);
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

  // Start OAuth flow via backend
  const handleConnectGitHub = () => {
    window.location.href = `${API_BASE_URL}/auth/github/login/`;
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Connect Repository</h1>
          <p className="text-muted-foreground mt-2">Connect your GitHub repositories for automated code review and security scanning</p>
        </div>
      </motion.div>
      {/* Only show Connect GitHub card if no repos and not loading */}
      {(!loading && repos.length === 0) && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2"><Link2 className="w-5 h-5 text-blue-600" /><span>Connect GitHub</span></CardTitle>
              <CardDescription>Authenticate with GitHub to enable repository scanning</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleConnectGitHub} className="bg-gradient-to-r from-blue-500 to-purple-500 text-white" disabled={loading}>
                <PlusCircle className="w-4 h-4 mr-2" />Connect GitHub
              </Button>
              {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
              <p className="text-xs text-muted-foreground mt-2">OAuth flow handled by backend.</p>
            </CardContent>
          </Card>
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><GitBranch className="w-5 h-5 text-blue-600" /><span>Connected Repositories</span></CardTitle>
            <CardDescription>Repositories currently connected for code review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {error && <div className="text-xs text-red-500">{error}</div>}
            {loading ? (
              <div className="text-muted-foreground">Loading repositories...</div>
            ) : repos.length === 0 ? (
              <div className="text-muted-foreground">No repositories found.</div>
            ) : (
              repos.map((repo) => (
                <div key={repo.id} className="flex items-center justify-between p-2 border rounded-lg hover:shadow transition-shadow">
                  <div className="flex items-center gap-2">
                    <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-6 h-6 rounded-full" />
                    <span className="font-medium text-blue-700 dark:text-blue-300">{repo.name}</span>
                    {repo.private && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">Private</span>}
                    {repo.language && <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">{repo.language}</span>}
                  </div>
                  <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline">View on GitHub</a>
                </div>
              ))
            )}
            {/* Pagination controls */}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page === 1 || loading}>Prev</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={repos.length < pageSize || loading}>Next</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewConnect;