import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  GitCommit, 
  GitPullRequest, 
  Shield, 
  Search,
  RefreshCw,
  Info,
  ChevronDown,
  ExternalLink,
  Calendar,
  Clock,
  FileText,
  GitBranch
} from "lucide-react";
import { motion } from "framer-motion";

interface Developer {
  id: string;
  fullName: string;
  username: string;
  prsCreated: number;
  reviewComments: number;
  acceptedComments: number;
  acceptanceRate: number;
  avatar?: string;
}

interface UserDetail {
  id: string;
  fullName: string;
  username: string;
  commits: Commit[];
  findings: Finding[];
  repositories: Repository[];
}

interface Commit {
  id: string;
  message: string;
  repository: string;
  date: string;
  hash: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Resolved' | 'Open';
  resolution?: 'Fixed' | 'Accepted' | 'Marked False Positive';
}

interface Finding {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Resolved';
  resolution?: 'Fixed' | 'Accepted' | 'Marked False Positive';
  repository: string;
  file: string;
  line: number;
  createdAt: string;
  resolvedAt?: string;
}

interface Repository {
  name: string;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  lastCommit: string;
  totalCommits: number;
  securityScore: number;
}

const mockDevelopers: Developer[] = [
  {
    id: "1",
    fullName: "Fodilu Akorede",
    username: "RoadRunner11",
    prsCreated: 5,
    reviewComments: 3,
    acceptedComments: 2,
    acceptanceRate: 66.7
  },
  {
    id: "2",
    fullName: "Bruno Cardoso",
    username: "brunobcardoso",
    prsCreated: 15,
    reviewComments: 25,
    acceptedComments: 15,
    acceptanceRate: 60.0
  },
  {
    id: "3",
    fullName: "Babar Majeed",
    username: "babarmajeed85",
    prsCreated: 6,
    reviewComments: 19,
    acceptedComments: 8,
    acceptanceRate: 42.1
  },
  {
    id: "4",
    fullName: "Roland Sing",
    username: "rolandsing",
    prsCreated: 10,
    reviewComments: 9,
    acceptedComments: 3,
    acceptanceRate: 33.3
  },
  {
    id: "5",
    fullName: "Joan Ngatia",
    username: "JoanNgatia",
    prsCreated: 9,
    reviewComments: 9,
    acceptedComments: 2,
    acceptanceRate: 22.2
  },
  {
    id: "6",
    fullName: "Leonardo Vitor da Silva",
    username: "leonardo-skywatch",
    prsCreated: 9,
    reviewComments: 52,
    acceptedComments: 7,
    acceptanceRate: 13.5
  },
  {
    id: "7",
    fullName: "Kate Medvedeva",
    username: "KateM3d",
    prsCreated: 10,
    reviewComments: 23,
    acceptedComments: 1,
    acceptanceRate: 4.35
  },
  {
    id: "8",
    fullName: "Alexander De Souza",
    username: "alexander-skywatch",
    prsCreated: 0,
    reviewComments: 0,
    acceptedComments: 0,
    acceptanceRate: 0
  }
];

const mockUserDetails: UserDetail[] = [
  {
    id: "1",
    fullName: "Fodilu Akorede",
    username: "RoadRunner11",
    commits: [
      {
        id: "c1",
        message: "Fix SQL injection vulnerability in user authentication",
        repository: "ipservices",
        date: "2024-01-15",
        hash: "a1b2c3d4",
        riskLevel: "High",
        status: "Resolved",
        resolution: "Fixed"
      },
      {
        id: "c2",
        message: "Add input validation for API endpoints",
        repository: "ipservices",
        date: "2024-01-14",
        hash: "e5f6g7h8",
        riskLevel: "Medium",
        status: "Resolved",
        resolution: "Fixed"
      },
      {
        id: "c3",
        message: "Update dependency versions for security patches",
        repository: "ipservices",
        date: "2024-01-13",
        hash: "i9j0k1l2",
        riskLevel: "Low",
        status: "Open"
      }
    ],
    findings: [
      {
        id: "f1",
        title: "SQL Injection Vulnerability",
        description: "Potential SQL injection in user input handling",
        severity: "High",
        status: "Resolved",
        resolution: "Fixed",
        repository: "ipservices",
        file: "src/auth/service.py",
        line: 45,
        createdAt: "2024-01-15T10:30:00Z",
        resolvedAt: "2024-01-15T11:00:00Z"
      },
      {
        id: "f2",
        title: "Hardcoded API Key",
        description: "API key found hardcoded in configuration file",
        severity: "Critical",
        status: "Resolved",
        resolution: "Fixed",
        repository: "ipservices",
        file: "src/config/settings.py",
        line: 23,
        createdAt: "2024-01-14T09:15:00Z",
        resolvedAt: "2024-01-14T10:30:00Z"
      },
      {
        id: "f3",
        title: "Weak Password Policy",
        description: "Password policy allows weak passwords",
        severity: "Medium",
        status: "Open",
        repository: "ipservices",
        file: "src/auth/validators.py",
        line: 12,
        createdAt: "2024-01-13T14:20:00Z"
      }
    ],
    repositories: [
      {
        name: "ipservices",
        riskLevel: "Medium",
        lastCommit: "2024-01-15",
        totalCommits: 45,
        securityScore: 78
      }
    ]
  }
];

const CodeReviewTeam = () => {
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [repositoryFilter, setRepositoryFilter] = useState("all");
  const [usernameFilter, setUsernameFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");

  const getAcceptanceRateColor = (rate: number) => {
    if (rate >= 60) return "text-green-600";
    if (rate >= 30) return "text-orange-600";
    return "text-red-600";
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return <Badge className="bg-green-100 text-green-800">{risk}</Badge>;
      case 'Medium':
        return <Badge className="bg-orange-100 text-orange-800">{risk}</Badge>;
      case 'High':
        return <Badge className="bg-red-100 text-red-800">{risk}</Badge>;
      case 'Critical':
        return <Badge className="bg-red-500 text-white">{risk}</Badge>;
      default:
        return <Badge variant="secondary">{risk}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Resolved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />{status}</Badge>;
      case 'Open':
        return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="w-3 h-3 mr-1" />{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getResolutionBadge = (resolution?: string) => {
    if (!resolution) return null;
    switch (resolution) {
      case 'Fixed':
        return <Badge className="bg-green-100 text-green-800">{resolution}</Badge>;
      case 'Accepted':
        return <Badge className="bg-blue-100 text-blue-800">{resolution}</Badge>;
      case 'Marked False Positive':
        return <Badge className="bg-gray-100 text-gray-800">{resolution}</Badge>;
      default:
        return <Badge variant="secondary">{resolution}</Badge>;
    }
  };

  const handleUserClick = (developer: Developer) => {
    const userDetail = mockUserDetails.find(u => u.username === developer.username);
    if (userDetail) {
      setSelectedUser(userDetail);
      setShowUserDetails(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Team Security Habits
          </h1>
          <p className="text-muted-foreground mt-2">
            Analyze team commit/PR habits, risk trends, and get recommendations
          </p>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={repositoryFilter} onValueChange={setRepositoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Repository Name" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ipservices">ipservices</SelectItem>
              <SelectItem value="frontend">frontend</SelectItem>
              <SelectItem value="backend">backend</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={usernameFilter} onValueChange={setUsernameFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Username" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="RoadRunner11">RoadRunner11</SelectItem>
              <SelectItem value="brunobcardoso">brunobcardoso</SelectItem>
              <SelectItem value="babarmajeed85">babarmajeed85</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="backend">Backend</SelectItem>
              <SelectItem value="frontend">Frontend</SelectItem>
              <SelectItem value="devops">DevOps</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            UTC
          </Button>
          
          <Button variant="outline" size="sm">
            <Search className="w-4 h-4" />
          </Button>
          
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <motion.div 
        initial="hidden" 
        animate="visible" 
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
        }} 
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } }}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center">
                PRs Reviewed
                <Info className="h-4 w-4 ml-1 text-orange-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">Total 94</div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Incremental 112</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center">
                CodeRabbit Suggestions
                <Info className="h-4 w-4 ml-1 text-purple-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">Review Comments 163</div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Accepted 38</div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.5 } } }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center">
                Learnings
                <Info className="h-4 w-4 ml-1 text-green-600" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900 dark:text-green-100">Used 782</div>
              <div className="text-sm text-green-700 dark:text-green-300">Created 7</div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Developer Leaderboard */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Developer Adoption Leaderboard</span>
              <Info className="w-4 h-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>PRs Created</TableHead>
                  <TableHead>Review Comments</TableHead>
                  <TableHead>Accepted Comments</TableHead>
                  <TableHead className="flex items-center">
                    Acceptance Rate (%)
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockDevelopers.map((developer) => (
                  <TableRow 
                    key={developer.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleUserClick(developer)}
                  >
                    <TableCell className="font-medium">{developer.fullName}</TableCell>
                    <TableCell className="text-muted-foreground">{developer.username}</TableCell>
                    <TableCell>{developer.prsCreated}</TableCell>
                    <TableCell>{developer.reviewComments || "No data"}</TableCell>
                    <TableCell>{developer.acceptedComments}</TableCell>
                    <TableCell className={getAcceptanceRateColor(developer.acceptanceRate)}>
                      {developer.acceptanceRate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Details Dialog */}
      <Dialog open={showUserDetails} onOpenChange={setShowUserDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Developer Details - {selectedUser?.fullName}</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="commits" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="commits">Commits</TabsTrigger>
                <TabsTrigger value="findings">Findings</TabsTrigger>
                <TabsTrigger value="repositories">Repositories</TabsTrigger>
              </TabsList>
              
              <TabsContent value="commits" className="space-y-4">
                <div className="space-y-3">
                  {selectedUser.commits.map((commit) => (
                    <Card key={commit.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <GitCommit className="w-4 h-4 text-muted-foreground" />
                              <span className="font-mono text-sm text-blue-600">{commit.hash}</span>
                              <span className="text-sm text-muted-foreground">{commit.date}</span>
                            </div>
                            <h4 className="font-medium mb-2">{commit.message}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{commit.repository}</Badge>
                              {getRiskBadge(commit.riskLevel)}
                              {getStatusBadge(commit.status)}
                              {getResolutionBadge(commit.resolution)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="findings" className="space-y-4">
                <div className="space-y-3">
                  {selectedUser.findings.map((finding) => (
                    <Card key={finding.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{finding.title}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{finding.description}</p>
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">{finding.repository}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {finding.file}:{finding.line}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              {getRiskBadge(finding.severity)}
                              {getStatusBadge(finding.status)}
                              {getResolutionBadge(finding.resolution)}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="repositories" className="space-y-4">
                <div className="space-y-3">
                  {selectedUser.repositories.map((repo) => (
                    <Card key={repo.name}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <GitBranch className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium">{repo.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Security Score:</span>
                                <span className="ml-2 font-medium">{repo.securityScore}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Total Commits:</span>
                                <span className="ml-2 font-medium">{repo.totalCommits}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Last Commit:</span>
                                <span className="ml-2 font-medium">{repo.lastCommit}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Risk Level:</span>
                                <span className="ml-2">{getRiskBadge(repo.riskLevel)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CodeReviewTeam; 