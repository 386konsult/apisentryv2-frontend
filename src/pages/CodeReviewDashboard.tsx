import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Shield, GitBranch, TrendingUp, Zap, Users, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const repos = [
  { name: "api-gateway", score: 92, risk: "Low", lastScan: "2024-01-15", status: "Healthy" },
  { name: "frontend-app", score: 78, risk: "Medium", lastScan: "2024-01-14", status: "Issues Found" },
  { name: "auth-service", score: 65, risk: "High", lastScan: "2024-01-13", status: "Critical" },
];

const CodeReviewDashboard = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Source Code Review</h1>
          <p className="text-muted-foreground mt-2">Monitor codebase security, risk, and team habits across all connected repositories</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"><Zap className="w-4 h-4 mr-2" />Run All Scans</Button>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={{hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:0.1}}}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Connected Repos</CardTitle>
              <GitBranch className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{repos.length}</div>
              <p className="text-xs text-blue-700 dark:text-blue-300">Active integrations</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Avg Security Score</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">{Math.round(repos.reduce((a,b)=>a+b.score,0)/repos.length)}</div>
              <p className="text-xs text-green-700 dark:text-green-300">Across all repos</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">Risk Level</CardTitle>
              <TrendingUp className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{repos.filter(r=>r.risk!=='Low').length}</div>
              <p className="text-xs text-orange-700 dark:text-orange-300">Repos with risk</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200">Last Scan</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{repos[0].lastScan}</div>
              <p className="text-xs text-purple-700 dark:text-purple-300">Most recent</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><LayoutDashboard className="w-5 h-5 text-blue-600" /><span>Repository Overview</span></CardTitle>
            <CardDescription>Security scores, risk, and scan status for each repository</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {repos.map((repo, i) => (
              <motion.div key={repo.name} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{repo.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={repo.score > 85 ? 'bg-green-500 text-white' : repo.score > 70 ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}>Score: {repo.score}</Badge>
                      <Badge className={repo.risk === 'Low' ? 'bg-green-100 text-green-800' : repo.risk === 'Medium' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'}>{repo.risk} Risk</Badge>
                      <Badge variant="secondary">{repo.status}</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="ml-4">View Details</Button>
                </div>
                <div className="mt-2">
                  <Progress value={repo.score} className="h-2" />
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewDashboard; 