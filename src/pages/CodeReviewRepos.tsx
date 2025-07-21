import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GitBranch, Shield, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const repos = [
  { name: "api-gateway", score: 92, risk: "Low", lastScan: "2024-01-15", status: "Healthy" },
  { name: "frontend-app", score: 78, risk: "Medium", lastScan: "2024-01-14", status: "Issues Found" },
  { name: "auth-service", score: 65, risk: "High", lastScan: "2024-01-13", status: "Critical" },
];

const CodeReviewRepos = () => {
  const navigate = useNavigate();
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
            <Card className="p-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg font-semibold">{repo.name}</CardTitle>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="ml-4"><Zap className="w-4 h-4 mr-2" />Scan</Button>
                  <Button variant="outline" onClick={() => navigate(`/code-review-repos/${repo.name}`)}>View Details</Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4 mb-2">
                  <span className={repo.risk === 'Low' ? 'text-green-600' : repo.risk === 'Medium' ? 'text-orange-600' : 'text-red-600'}>{repo.risk} Risk</span>
                  <span className="text-xs text-muted-foreground">Last Scan: {repo.lastScan}</span>
                  <span className="text-xs text-muted-foreground">Status: {repo.status}</span>
                </div>
                <Progress value={repo.score} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default CodeReviewRepos; 