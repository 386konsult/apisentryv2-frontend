
import { useState, useEffect } from "react";
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
  Activity,
} from "lucide-react";
import { apiService, WAFRule } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const WAFRules = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [rules, setRules] = useState<WAFRule[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRules = async () => {
      try {
        const rulesData = await apiService.getWAFRules();
        setRules(rulesData);
      } catch (error) {
        toast({
          title: "Error loading WAF rules",
          description: "Failed to fetch WAF rules",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [toast]);

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
            <div className="text-2xl font-bold">{rules.length}</div>
            <p className="text-xs text-muted-foreground">4 added this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rules.filter(r => r.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {rules.length > 0 ? 
                `${((rules.filter(r => r.is_active).length / rules.length) * 100).toFixed(1)}% enabled` : 
                '0% enabled'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.filter(r => r.severity === 'high').length}
            </div>
            <p className="text-xs text-muted-foreground">Critical security rules</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches Today</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rules.reduce((sum, r) => sum + r.trigger_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total triggers today</p>
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
            {loading ? (
              <div className="text-center py-8">
                <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p>Loading WAF rules...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No WAF rules found</p>
              </div>
            ) : (
              rules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-3 w-3 rounded-full ${getPriorityColor(rule.severity)}`}
                      />
                      <Switch checked={rule.is_active} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge className={getCategoryColor(rule.rule_type)}>
                          {rule.rule_type}
                        </Badge>
                        <Badge variant="outline">{rule.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                        {rule.pattern}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                        <span>{rule.trigger_count} triggers</span>
                        <span>Action: {rule.action}</span>
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
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WAFRules;
