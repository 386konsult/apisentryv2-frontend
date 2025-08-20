import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GitBranch, Shield, Zap, TrendingUp, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface Repository {
  name: string;
  score: number;
  risk: "Low" | "Medium" | "High" | "Critical";
  lastScan: string;
  status: string;
  totalSuggestions: number;
  openSuggestions: number;
  resolvedSuggestions: number;
}

const repos: Repository[] = [
  { 
    name: "api-gateway", 
    score: 92, 
    risk: "Low", 
    lastScan: "2024-01-15", 
    status: "Healthy",
    totalSuggestions: 45,
    openSuggestions: 12,
    resolvedSuggestions: 33
  },
  { 
    name: "frontend-app", 
    score: 78, 
    risk: "Medium", 
    lastScan: "2024-01-14", 
    status: "Issues Found",
    totalSuggestions: 67,
    openSuggestions: 28,
    resolvedSuggestions: 39
  },
  { 
    name: "auth-service", 
    score: 65, 
    risk: "High", 
    lastScan: "2024-01-13", 
    status: "Critical",
    totalSuggestions: 89,
    openSuggestions: 45,
    resolvedSuggestions: 44
  },
  { 
    name: "backend-service", 
    score: 85, 
    risk: "Low", 
    lastScan: "2024-01-12", 
    status: "Healthy",
    totalSuggestions: 34,
    openSuggestions: 8,
    resolvedSuggestions: 26
  },
  { 
    name: "data-processor", 
    score: 71, 
    risk: "Medium", 
    lastScan: "2024-01-11", 
    status: "Issues Found",
    totalSuggestions: 56,
    openSuggestions: 23,
    resolvedSuggestions: 33
  },
  { 
    name: "web-portal", 
    score: 88, 
    risk: "Low", 
    lastScan: "2024-01-10", 
    status: "Healthy",
    totalSuggestions: 41,
    openSuggestions: 15,
    resolvedSuggestions: 26
  }
];

const CodeReviewRepos = () => {
  const navigate = useNavigate();
  const [scanningRepos, setScanningRepos] = useState<Set<string>>(new Set());

  const getRiskBadge = (risk: string) => {
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
        return <Badge variant="secondary">{risk} Risk</Badge>;
    }
  };

  const handleScan = async (repoName: string) => {
    setScanningRepos(prev => new Set(prev).add(repoName));
    
    // Simulate scan process
    setTimeout(() => {
      setScanningRepos(prev => {
        const newSet = new Set(prev);
        newSet.delete(repoName);
        return newSet;
      });
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Repositories</h1>
          <p className="text-muted-foreground mt-2">View and manage all connected repositories for code review</p>
        </div>
      </motion.div>
      
      <motion.div initial="hidden" animate="visible" variants={{hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:0.1}}}} className="space-y-4">
        {repos.map((repo, i) => (
          <motion.div key={repo.name} variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
            <Card className="p-4">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div className="flex items-center space-x-3">
                  <GitBranch className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle className="text-xl font-semibold">{repo.name}</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground">
                      Last run: {repo.lastScan}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getRiskBadge(repo.risk)}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => handleScan(repo.name)}
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
                    <span className="text-2xl font-bold text-blue-600">{repo.totalSuggestions}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Open Suggestions</span>
                    <span className="text-2xl font-bold text-orange-600">{repo.openSuggestions}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Resolved Suggestions</span>
                    <span className="text-2xl font-bold text-green-600">{repo.resolvedSuggestions}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Security Score</span>
                    <span className="text-2xl font-bold text-purple-600">{repo.score}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default CodeReviewRepos; 