import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Users, GitCommit, GitPullRequest, Shield, Code2, UserPlus, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/services/api";

const teammates = ["Alice", "Bob", "Charlie", "Dana"]; // Example teammates, replace with your actual data

const CodeReviewRepoDetails = () => {
  const { repoName } = useParams<{ repoName: string }>();
  const [vulnerabilities, setVulnerabilities] = useState([]);
  const [commits, setCommits] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState<{[id:string]:string}>({});
  const [statuses, setStatuses] = useState<{[id:string]:string}>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        const headers = token ? { Authorization: `Token ${token}` } : {};

        if (!repoName) {
          throw new Error("Repository name is undefined. Check the route or parameter.");
        }

        // Fetch repository list to get full_name and html_url
        const reposResponse = await fetch(
          `${API_BASE_URL}/github/repos/?page=1&page_size=100`,
          { headers }
        );
        if (!reposResponse.ok) throw new Error("Failed to fetch repository list");
        const repos = await reposResponse.json();
        const repoDetails = repos.find((repo: any) => repo.name === repoName);
        if (!repoDetails) {
          throw new Error(`Repository with name '${repoName}' not found in the list.`);
        }
        const fullName = repoDetails.full_name; // e.g., "Just-Mike4/personal-task-tracker"

        const [owner, repo] = fullName.split("/");
        if (!owner || !repo) {
          throw new Error("Invalid repository full_name format. Expected 'owner/repo'.");
        }

        // Fetch vulnerabilities
        const issuesResponse = await fetch(
          `${API_BASE_URL}/github/repos/${owner}/${repo}/issues/`,
          { headers }
        );
        if (!issuesResponse.ok) throw new Error("Failed to fetch issues");
        const issuesData = await issuesResponse.json();
        setVulnerabilities(issuesData.issues || issuesData || []);

        // Fetch summary
        const summaryResponse = await fetch(
          `${API_BASE_URL}/github/repos/${owner}/${repo}/summary/`,
          { headers }
        );
        if (!summaryResponse.ok) throw new Error("Failed to fetch summary");
        const summaryData = await summaryResponse.json();
        setSummary(summaryData.summary || summaryData);

        // Fetch commits
        const commitsResponse = await fetch(
          `${API_BASE_URL}/github/repos/${owner}/${repo}/commits/`,
          { headers }
        );
        if (commitsResponse.ok) {
          const commitsData = await commitsResponse.json();
          setCommits(commitsData.commits || commitsData || []);
        }
      } catch (err) {
        console.error(err); // Log errors for debugging
        setError(err.message || "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [repoName]);

  const handleAssign = (id: string, value: string) => {
    setAssignments(prev => ({ ...prev, [id]: value }));
  };
  const handleStatus = (id: string, value: string) => {
    setStatuses(prev => ({ ...prev, [id]: value }));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">{repoName} - Full Scan Report</h1>
        <p className="text-muted-foreground mb-4">Detailed vulnerability and commit scan report for this repository</p>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Shield className="w-5 h-5 text-blue-600" /><span>Vulnerabilities</span></CardTitle>
            <CardDescription>Detected issues in the latest scan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative max-h-96 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>File</TableHead>
                    <TableHead>Line</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead>Suggested Fix</TableHead>
                    <TableHead>CVE</TableHead>
                    <TableHead>Assign</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vulnerabilities.map(vuln => (
                    <TableRow key={vuln.id || `${vuln.file}-${vuln.line}`}>
                      <TableCell className="font-mono text-xs">{vuln.file}</TableCell>
                      <TableCell>{vuln.line}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{vuln.code}</code></TableCell>
                      <TableCell><Badge variant="secondary">{vuln.type}</Badge></TableCell>
                      <TableCell><Badge className={vuln.risk === 'Critical' ? 'bg-red-500 text-white' : vuln.risk === 'High' ? 'bg-orange-500 text-white' : 'bg-yellow-500 text-black'}>{vuln.risk}</Badge></TableCell>
                      <TableCell className="text-xs">{vuln.recommendation}</TableCell>
                      <TableCell><code className="bg-muted px-2 py-1 rounded text-xs">{vuln.suggestedFix}</code></TableCell>
                      <TableCell>{vuln.cve}</TableCell>
                      <TableCell>
                        <Select value={assignments[vuln.id] || ''} onValueChange={val => handleAssign(vuln.id, val)}>
                          <SelectTrigger className="w-28">
                            <SelectValue placeholder="Assign" />
                          </SelectTrigger>
                          <SelectContent>
                            {teammates.map(tm => <SelectItem key={tm} value={tm}>{tm}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{statuses[vuln.id] || vuln.status}</Badge>
                      </TableCell>
                      <TableCell className="space-x-1">
                        <Button size="sm" variant="outline" onClick={() => handleStatus(vuln.id, 'resolved')}>
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleStatus(vuln.id, 'false positive')}>
                          <XCircle className="w-4 h-4 text-orange-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><GitCommit className="w-5 h-5 text-blue-600" /><span>Recent Commits & PRs</span></CardTitle>
            <CardDescription>Scan report and status for each commit/PR</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative max-h-96 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Commit</TableHead>
                    <TableHead>Committer</TableHead>
                    <TableHead>PR Status</TableHead>
                    <TableHead>Issue Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {commits.map(commit => (
                    <TableRow key={commit.id || commit.message}>
                      <TableCell className="font-mono text-xs">{commit.message}</TableCell>
                      <TableCell>{commit.committer}</TableCell>
                      <TableCell><Badge variant="secondary">{commit.prStatus}</Badge></TableCell>
                      <TableCell><Badge variant="secondary">{commit.issueStatus}</Badge></TableCell>
                      <TableCell><Badge className={commit.score > 85 ? 'bg-green-500 text-white' : commit.score > 70 ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}>{commit.score}</Badge></TableCell>
                      <TableCell>{commit.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewRepoDetails;