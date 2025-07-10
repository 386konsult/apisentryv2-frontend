
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Shield,
  Edit,
  Trash2,
  Download,
  Upload,
  Code,
  Filter,
} from "lucide-react";

const WAFRules = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const mockRules = [
    {
      id: 1,
      name: "SQL Injection Protection",
      pattern: "(union|select|insert|delete|drop|alter|create)",
      category: "injection",
      enabled: true,
      priority: "high",
      matches: 1247,
      lastTriggered: "2 hours ago",
    },
    {
      id: 2,
      name: "XSS Prevention",
      pattern: "(<script|javascript:|on\\w+=)",
      category: "xss",
      enabled: true,
      priority: "high",
      matches: 892,
      lastTriggered: "1 hour ago",
    },
    {
      id: 3,
      name: "Rate Limiting",
      pattern: "rate_limit: 100/min",
      category: "dos",
      enabled: true,
      priority: "medium",
      matches: 234,
      lastTriggered: "30 min ago",
    },
    {
      id: 4,
      name: "File Upload Validation",
      pattern: "\\.(exe|bat|cmd|scr|com|pif)",
      category: "upload",
      enabled: false,
      priority: "medium",
      matches: 45,
      lastTriggered: "1 day ago",
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      injection: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      xss: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      dos: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      upload: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: "bg-red-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WAF Rules</h1>
          <p className="text-muted-foreground">
            Manage Web Application Firewall rules and security policies
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                New Rule
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New WAF Rule</DialogTitle>
                <DialogDescription>
                  Define a new security rule to protect your APIs
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ruleName">Rule Name</Label>
                    <Input id="ruleName" placeholder="Enter rule name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="injection">SQL Injection</SelectItem>
                        <SelectItem value="xss">Cross-Site Scripting</SelectItem>
                        <SelectItem value="dos">DoS Protection</SelectItem>
                        <SelectItem value="upload">File Upload</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pattern">Pattern</Label>
                  <Textarea
                    id="pattern"
                    placeholder="Enter regex pattern or rule definition"
                    className="font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2 pt-6">
                    <Switch id="enabled" />
                    <Label htmlFor="enabled">Enable Rule</Label>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Create Rule</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">247</div>
            <p className="text-xs text-muted-foreground">4 added this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">234</div>
            <p className="text-xs text-muted-foreground">94.7% enabled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">Critical security rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Today</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18,742</div>
            <p className="text-xs text-muted-foreground">+12% from yesterday</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="injection">SQL Injection</SelectItem>
                  <SelectItem value="xss">XSS</SelectItem>
                  <SelectItem value="dos">DoS Protection</SelectItem>
                  <SelectItem value="upload">File Upload</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Security Rules</CardTitle>
          <CardDescription>
            Manage and configure your WAF security rules
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${getPriorityColor(rule.priority)}`}
                    />
                    <Switch checked={rule.enabled} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{rule.name}</h3>
                      <Badge className={getCategoryColor(rule.category)}>
                        {rule.category}
                      </Badge>
                      <Badge variant="outline">{rule.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {rule.pattern}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                      <span>{rule.matches} matches</span>
                      <span>Last triggered: {rule.lastTriggered}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Code className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WAFRules;
