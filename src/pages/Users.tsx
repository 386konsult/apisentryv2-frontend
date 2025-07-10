
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users as UsersIcon,
  UserPlus,
  Search,
  Filter,
  Key,
  Settings,
  Copy,
  MoreHorizontal,
  Shield,
  Eye,
  Edit,
} from "lucide-react";
import { useState } from "react";

const Users = () => {
  const [activeTab, setActiveTab] = useState("users");

  const mockUsers = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@company.com",
      role: "admin",
      status: "active",
      lastLogin: "2 hours ago",
      avatar: "/api/placeholder/32/32",
    },
    {
      id: 2,
      name: "Sarah Chen",
      email: "sarah.chen@company.com",
      role: "analyst",
      status: "active",
      lastLogin: "1 day ago",
      avatar: "/api/placeholder/32/32",
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      role: "viewer",
      status: "active",
      lastLogin: "3 days ago",
      avatar: "/api/placeholder/32/32",
    },
    {
      id: 4,
      name: "Lisa Wang",
      email: "lisa.wang@company.com",
      role: "analyst",
      status: "inactive",
      lastLogin: "2 weeks ago",
      avatar: "/api/placeholder/32/32",
    },
  ];

  const mockTokens = [
    {
      id: 1,
      name: "Production API",
      token: "sk_live_abc123...xyz789",
      permissions: ["read", "write"],
      created: "2024-01-01",
      lastUsed: "2 hours ago",
      status: "active",
    },
    {
      id: 2,
      name: "Staging Environment",
      token: "sk_test_def456...uvw012",
      permissions: ["read"],
      created: "2024-01-10",
      lastUsed: "1 day ago",
      status: "active",
    },
    {
      id: 3,
      name: "Monitoring Service",
      token: "sk_live_ghi789...rst345",
      permissions: ["read"],
      created: "2024-01-05",
      lastUsed: "Never",
      status: "inactive",
    },
  ];

  const getRoleColor = (role: string) => {
    const colors = {
      admin: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      analyst: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      viewer: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    return colors[role as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusColor = (status: string) => {
    return status === "active" 
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users & Teams</h1>
          <p className="text-muted-foreground">
            Manage team members, roles, and API access tokens
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Key className="h-4 w-4 mr-2" />
            Generate Token
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join your security team
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="user@company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="analyst">Security Analyst</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline">Cancel</Button>
                  <Button>Send Invitation</Button>
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
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">2 added this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">11</div>
            <p className="text-xs text-muted-foreground">91.7% active rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Tokens</CardTitle>
            <Key className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">3 production keys</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Full access granted</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "users" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("users")}
        >
          <UsersIcon className="h-4 w-4 mr-2" />
          Team Members
        </Button>
        <Button
          variant={activeTab === "tokens" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("tokens")}
        >
          <Key className="h-4 w-4 mr-2" />
          API Tokens
        </Button>
      </div>

      {/* Team Members Tab */}
      {activeTab === "users" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  Manage user access and permissions for your security platform
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-8 w-64" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="analyst">Analyst</SelectItem>
                    <SelectItem value="viewer">Viewer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Last login: {user.lastLogin}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Badge className={getRoleColor(user.role)}>
                      {user.role}
                    </Badge>
                    <Badge className={getStatusColor(user.status)}>
                      {user.status}
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* API Tokens Tab */}
      {activeTab === "tokens" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Tokens</CardTitle>
                <CardDescription>
                  Manage API access tokens for automated integrations
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Key className="h-4 w-4 mr-2" />
                    Generate New Token
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate API Token</DialogTitle>
                    <DialogDescription>
                      Create a new API token for programmatic access
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="tokenName">Token Name</Label>
                      <Input id="tokenName" placeholder="Production API Access" />
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" defaultChecked />
                          <span className="text-sm">Read access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span className="text-sm">Write access</span>
                        </label>
                        <label className="flex items-center space-x-2">
                          <input type="checkbox" />
                          <span className="text-sm">Admin access</span>
                        </label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline">Cancel</Button>
                      <Button>Generate Token</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockTokens.map((token) => (
                <div
                  key={token.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{token.name}</h3>
                      <Badge className={getStatusColor(token.status)}>
                        {token.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                        {token.token}
                      </code>
                      <Button variant="ghost" size="sm">
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Created: {token.created}</span>
                      <span>Last used: {token.lastUsed}</span>
                      <span>Permissions: {token.permissions.join(', ')}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Users;
