import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  score?: number;
  risk?: "Low" | "Medium" | "High" | "Critical";
  lastScan?: string;
  status?: string;
  totalSuggestions?: number;
  openSuggestions?: number;
  resolvedSuggestions?: number;
}

const CodeReviewRepos = () => {
  const navigate = useNavigate();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [scanningRepos, setScanningRepos] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('auth_token');
    fetch(`${API_BASE_URL}/github/repos/?page=${page}&page_size=${pageSize}`, {
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
  }, [page, pageSize]);

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

  const handleScan = async (repo: Repository) => {
    setScanningRepos(prev => new Set(prev).add(repo.name));
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch(`${API_BASE_URL}/github/scan/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({ repo_url: repo.html_url })
      });
      if (!response.ok) {
        throw new Error('Scan initiation failed');
      }
      // Optionally show a success message
    } catch (error) {
      console.error("Scan error:", error);
      // Optionally show an error message
    } finally {
      setTimeout(() => {
        setScanningRepos(prev => {
          const newSet = new Set(prev);
          newSet.delete(repo.name);
          return newSet;
        });
      }, 3000); // Keep spinner for a few seconds for user feedback
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Repositories</h1>
          <p className="text-muted-foreground mt-2">View and manage all connected repositories for code review</p>
        </div>
      </motion.div>
      {error && <div className="text-xs text-red-500">{error}</div>}
      <motion.div initial="hidden" animate="visible" variants={{hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:0.1}}}} className="space-y-4">
        {loading ? (
          <div className="text-muted-foreground">Loading repositories...</div>
        ) : repos.length === 0 ? (
          <div className="text-muted-foreground">No repositories found.</div>
        ) : (
          repos.map((repo) => (
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
                    {getRiskBadge(repo.risk)}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => handleScan(repo)}
                        disabled={scanningRepos.has(repo.name)}
                      >
                        {scanningRepos.has(repo.name) ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Scanning...
                          </>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-2" />
                            Scan
                          </>
                        )}
                      </Button>
                      <Button variant="outline" onClick={() => navigate(`/code-review-repos/${repo.name}`)}>
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-muted-foreground">Total Suggestions</span>
                      <span className="text-2xl font-bold text-blue-600">{repo.totalSuggestions ?? 0}</span>
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
                      <span className="text-sm font-medium text-muted-foreground">Security Score</span>
                      <span className="text-2xl font-bold text-purple-600">{repo.score ?? 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
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