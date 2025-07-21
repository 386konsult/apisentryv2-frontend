import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, CheckCircle, AlertTriangle, GitCommit, GitPullRequest, Shield } from "lucide-react";
import { motion } from "framer-motion";

const commits = [
  { id: "c1", author: "Alice", message: "Fix SQL injection", date: "2024-01-15", risk: "Resolved", score: 95 },
  { id: "c2", author: "Bob", message: "Add input validation", date: "2024-01-14", risk: "Merged", score: 90 },
  { id: "c3", author: "Eve", message: "Refactor auth logic", date: "2024-01-13", risk: "Open", score: 70 },
];

const CodeReviewTeam = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Team Security Habits</h1>
          <p className="text-muted-foreground mt-2">Analyze team commit/PR habits, risk trends, and get recommendations</p>
        </div>
      </motion.div>
      <motion.div initial="hidden" animate="visible" variants={{hidden:{opacity:0},visible:{opacity:1,transition:{staggerChildren:0.1}}}} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200">Avg Security Score</CardTitle>
              <Shield className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">85</div>
              <p className="text-xs text-green-700 dark:text-green-300">Across all team commits</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200">Recent Commits</CardTitle>
              <GitCommit className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{commits.length}</div>
              <p className="text-xs text-blue-700 dark:text-blue-300">Last 7 days</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200">PRs Merged</CardTitle>
              <GitPullRequest className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">2</div>
              <p className="text-xs text-orange-700 dark:text-orange-300">Last 7 days</p>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div variants={{hidden:{y:20,opacity:0},visible:{y:0,opacity:1,transition:{duration:0.5}}}}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 border-red-200 dark:border-red-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-800 dark:text-red-200">Open Risks</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-900 dark:text-red-100">1</div>
              <p className="text-xs text-red-700 dark:text-red-300">Unresolved issues</p>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Users className="w-5 h-5 text-blue-600" /><span>Recent Commits & Risk</span></CardTitle>
            <CardDescription>Scan report and status for each commit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {commits.map((commit, i) => (
              <motion.div key={commit.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{commit.message}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={commit.score > 85 ? 'bg-green-500 text-white' : commit.score > 70 ? 'bg-orange-500 text-white' : 'bg-red-500 text-white'}>Score: {commit.score}</Badge>
                      <Badge variant="secondary">{commit.risk}</Badge>
                      <span className="text-xs text-muted-foreground">{commit.date}</span>
                    </div>
                  </div>
                  <span className="font-medium text-blue-700 dark:text-blue-300">{commit.author}</span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>Improve your team’s security posture</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="p-3 bg-green-50 dark:bg-green-900 rounded">✅ Encourage code reviews for all PRs</div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded">✅ Enforce commit message standards</div>
            <div className="p-3 bg-orange-50 dark:bg-orange-900 rounded">⚠️ Address open risks promptly</div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded">✅ Celebrate security improvements!</div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewTeam; 