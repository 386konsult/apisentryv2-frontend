import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link2, GitBranch, PlusCircle } from "lucide-react";
import { motion } from "framer-motion";

const connectedRepos = [
  { name: "api-gateway", url: "https://github.com/org/api-gateway" },
  { name: "frontend-app", url: "https://github.com/org/frontend-app" },
];

const CodeReviewConnect = () => {
  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Connect Repository</h1>
          <p className="text-muted-foreground mt-2">Connect your GitHub repositories for automated code review and security scanning</p>
        </div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Link2 className="w-5 h-5 text-blue-600" /><span>Connect GitHub</span></CardTitle>
            <CardDescription>Authenticate with GitHub to enable repository scanning</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-500 text-white"><PlusCircle className="w-4 h-4 mr-2" />Connect GitHub</Button>
            <p className="text-xs text-muted-foreground mt-2">OAuth flow placeholder. (Integrate with GitHub OAuth for real connection.)</p>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><GitBranch className="w-5 h-5 text-blue-600" /><span>Connected Repositories</span></CardTitle>
            <CardDescription>Repositories currently connected for code review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {connectedRepos.map(repo => (
              <div key={repo.name} className="flex items-center justify-between p-2 border rounded-lg hover:shadow transition-shadow">
                <span className="font-medium text-blue-700 dark:text-blue-300">{repo.name}</span>
                <a href={repo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground underline">View on GitHub</a>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CodeReviewConnect; 