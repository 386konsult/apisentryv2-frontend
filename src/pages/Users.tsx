
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Activity,
  Mail,
  X,
  Trash2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { apiService, User, Invitation, PlatformMember, InviteRequest } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { usePlatform } from "@/contexts/PlatformContext";
import {
  AlertDialog as AlertDialogComponent,
  AlertDialogAction as AlertDialogActionComponent,
  AlertDialogCancel as AlertDialogCancelComponent,
  AlertDialogContent as AlertDialogContentComponent,
  AlertDialogDescription as AlertDialogDescriptionComponent,
  AlertDialogFooter as AlertDialogFooterComponent,
  AlertDialogHeader as AlertDialogHeaderComponent,
  AlertDialogTitle as AlertDialogTitleComponent,
} from "@/components/ui/alert-dialog";

// Local type for normalized member data (for display)
interface NormalizedMember {
  id: string | number;
  role: 'admin' | 'analyst' | 'viewer';
  joined_at: string;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
  };
}

const Users = () => {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState<NormalizedMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [cancelInviteId, setCancelInviteId] = useState<number | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<number | null>(null);
  const { toast } = useToast();
  const { selectedPlatformId } = usePlatform();

  const loadData = async () => {
    if (!selectedPlatformId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch platform members
      const membersData = await apiService.getPlatformMembers(selectedPlatformId);
      
      // The API returns members with user_email and user_name directly
      // Map to the expected structure for rendering
      const normalizedMembers = Array.isArray(membersData) 
        ? membersData.map((member: any) => {
            // Parse user_name to extract first and last name
            const nameParts = (member.user_name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            // Determine role based on is_owner or use provided role
            let role = member.role || 'viewer';
            if (member.is_owner) {
              role = 'admin';
            }
            
            return {
              id: member.id,
              role: role as 'admin' | 'analyst' | 'viewer',
              joined_at: member.created_at || member.updated_at || new Date().toISOString(),
              user: {
                id: typeof member.user === 'number' ? member.user : 0,
                email: member.user_email || '',
                first_name: firstName,
                last_name: lastName,
                username: member.user_email?.split('@')[0] || '',
              }
            };
          })
        : [];
      
      setMembers(normalizedMembers);

      // Fetch invitations
      const invitationsData = await apiService.getInvitations(selectedPlatformId);
      setInvitations(invitationsData);

      // Also fetch all users (for reference)
      try {
        const usersData = await apiService.getUsers();
        setUsers(usersData);
      } catch (error) {
        // Users endpoint might not be available, that's okay
        console.warn('Failed to fetch users:', error);
      }
    } catch (error: any) {
      toast({
        title: "Error loading data",
        description: error.message || "Failed to fetch members and invitations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPlatformId, toast]);

  const handleSendInvitation = async () => {
    if (!selectedPlatformId) {
      toast({
        title: "Error",
        description: "Please select a platform first",
        variant: "destructive",
      });
      return;
    }

    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setInviteLoading(true);
    try {
      const invitationData: InviteRequest = {
        email: inviteEmail,
        message: inviteMessage || undefined,
      };

      await apiService.sendInvitation(selectedPlatformId, invitationData);
      
      toast({
        title: "Invitation sent",
        description: `Invitation has been sent to ${inviteEmail}`,
      });

      // Reset form and close dialog
      setInviteEmail("");
      setInviteMessage("");
      setInviteDialogOpen(false);

      // Reload invitations
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancelInviteId) return;

    try {
      await apiService.cancelInvitation(cancelInviteId);
      
      toast({
        title: "Invitation cancelled",
        description: "The invitation has been cancelled",
      });

      setCancelInviteId(null);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error cancelling invitation",
        description: error.message || "Failed to cancel invitation",
        variant: "destructive",
      });
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedPlatformId || !removeMemberId) return;

    try {
      await apiService.removeMember(selectedPlatformId, removeMemberId);
      
      toast({
        title: "Member removed",
        description: "The member has been removed from the platform",
      });

      setRemoveMemberId(null);
      await loadData();
    } catch (error: any) {
      toast({
        title: "Error removing member",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    }
  };

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
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-primary" disabled={!selectedPlatformId}>
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
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="user@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message (Optional)</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Optional invitation message (max 500 characters)"
                    value={inviteMessage}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 500) {
                        setInviteMessage(value);
                      }
                    }}
                    maxLength={500}
                    rows={3}
                  />
                  <p className="text-xs text-muted-foreground">
                    {inviteMessage.length}/500 characters
                  </p>
                </div>
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setInviteDialogOpen(false);
                      setInviteEmail("");
                      setInviteMessage("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSendInvitation}
                    disabled={inviteLoading || !inviteEmail}
                  >
                    {inviteLoading ? "Sending..." : "Send Invitation"}
                  </Button>
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
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-muted-foreground">{invitations.length} pending invitations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {members.length}
            </div>
            <p className="text-xs text-muted-foreground">
              All members active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Tokens</CardTitle>
            <Key className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Users</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {members.filter(m => m.role === 'admin').length}
            </div>
            <p className="text-xs text-muted-foreground">Full access granted</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "members" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("members")}
        >
          <UsersIcon className="h-4 w-4 mr-2" />
          Members ({members.length})
        </Button>
        <Button
          variant={activeTab === "invitations" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("invitations")}
        >
          <Mail className="h-4 w-4 mr-2" />
          Invitations ({invitations.filter(i => i.status === 'pending').length})
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

      {/* Platform Members Tab */}
      {activeTab === "members" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Platform Members</CardTitle>
                <CardDescription>
                  Manage members and their roles for the selected platform
                </CardDescription>
              </div>
              {!selectedPlatformId && (
                <p className="text-sm text-muted-foreground">Please select a platform</p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading members...</p>
                </div>
              ) : !selectedPlatformId ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Please select a platform to view members</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No members found for this platform</p>
                </div>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarFallback>
                          {(member.user?.first_name?.[0] || 'U')}{(member.user?.last_name?.[0] || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {member.user?.first_name || ''} {member.user?.last_name || ''}
                        </h3>
                        <p className="text-sm text-muted-foreground">{member.user?.email || 'No email'}</p>
                        <p className="text-xs text-muted-foreground">
                          Joined {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={getRoleColor(member.role)}>
                        {member.role}
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setRemoveMemberId(Number(member.id))}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invitations Tab */}
      {activeTab === "invitations" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>
                  Manage invitations sent to team members
                </CardDescription>
              </div>
              {!selectedPlatformId && (
                <p className="text-sm text-muted-foreground">Please select a platform</p>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
                  <p>Loading invitations...</p>
                </div>
              ) : !selectedPlatformId ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Please select a platform to view invitations</p>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No invitations found</p>
                  <p className="text-sm text-muted-foreground mt-2">Invite team members to get started</p>
                </div>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">{invitation.email}</h3>
                        {invitation.message && (
                          <p className="text-sm text-muted-foreground">{invitation.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Invited by {invitation.invited_by} • {new Date(invitation.created_at).toLocaleDateString()}
                          {invitation.expires_at && ` • Expires ${new Date(invitation.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge className={
                        invitation.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : invitation.status === 'accepted'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }>
                        {invitation.status}
                      </Badge>
                      {invitation.status === 'pending' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setCancelInviteId(invitation.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
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
              <div className="text-center py-8">
                <p className="text-muted-foreground">API token management coming soon</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel Invitation Confirmation Dialog */}
      <AlertDialogComponent open={cancelInviteId !== null} onOpenChange={(open) => !open && setCancelInviteId(null)}>
        <AlertDialogContentComponent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Cancel Invitation</AlertDialogTitleComponent>
            <AlertDialogDescriptionComponent>
              Are you sure you want to cancel this invitation? This action cannot be undone.
            </AlertDialogDescriptionComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancelComponent onClick={() => setCancelInviteId(null)}>
              Keep Invitation
            </AlertDialogCancelComponent>
            <AlertDialogActionComponent
              onClick={handleCancelInvitation}
              className="bg-red-600 hover:bg-red-700"
            >
              Cancel Invitation
            </AlertDialogActionComponent>
          </AlertDialogFooterComponent>
        </AlertDialogContentComponent>
      </AlertDialogComponent>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialogComponent open={removeMemberId !== null} onOpenChange={(open) => !open && setRemoveMemberId(null)}>
        <AlertDialogContentComponent>
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent>Remove Member</AlertDialogTitleComponent>
            <AlertDialogDescriptionComponent>
              Are you sure you want to remove this member from the platform? They will lose access immediately.
            </AlertDialogDescriptionComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancelComponent onClick={() => setRemoveMemberId(null)}>
              Keep Member
            </AlertDialogCancelComponent>
            <AlertDialogActionComponent
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Member
            </AlertDialogActionComponent>
          </AlertDialogFooterComponent>
        </AlertDialogContentComponent>
      </AlertDialogComponent>
    </div>
  );
};

export default Users;
