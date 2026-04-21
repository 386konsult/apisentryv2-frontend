import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  Key,
  Shield,
  Activity,
  Mail,
  X,
  Trash2,
  CheckCircle,
  Clock,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { apiService, User, Invitation, InviteRequest, OrganisationInvitation } from "@/services/api";
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

/* ─── Counting animation ─────────────────────────────────────────────── */
function useCountUp(target: number, duration = 1000, start = true) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start || target === 0) { setValue(target); return; }
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

const AnimatedNumber = ({ value }: { value: number }) => {
  const [inView, setInView] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  const count = useCountUp(value, 1000, inView);
  return <span ref={ref}>{count}</span>;
};

/* ─── Hover card wrapper ─────────────────────────────────────────────── */
const HoverCard = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -3, scale: 1.01 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    className={className}
  >
    {children}
  </motion.div>
);

/* ─── Types ──────────────────────────────────────────────────────────── */
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

/* ════════════════════════════════════════════════════════════════════════ */
const Users = () => {
  const [activeTab, setActiveTab] = useState("members");
  const [members, setMembers] = useState<NormalizedMember[]>([]);
  const [sentInvitations, setSentInvitations] = useState<OrganisationInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSentInvites, setLoadingSentInvites] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [cancelInviteId, setCancelInviteId] = useState<string | null>(null);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null); // Changed to string

  // New state for organisation‑level invitations
  const [inviteRole, setInviteRole] = useState<"org_admin" | "org_member">("org_member");
  const [inviteWorkspaceIds, setInviteWorkspaceIds] = useState<string[]>([]);
  const [availableWorkspaces, setAvailableWorkspaces] = useState<any[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(false);

  const { toast } = useToast();
  const { selectedPlatformId } = usePlatform();

  const loadData = async () => {
    if (!selectedPlatformId) {
      setLoading(false);
      setMembers([]);
      return;
    }
    setLoading(true);
    try {
      const membersData = await apiService.getPlatformMembers(selectedPlatformId);
      const normalizedMembers = Array.isArray(membersData)
        ? membersData.map((member: any) => {
            const nameParts = (member.user_name || '').split(' ');
            return {
              id: member.id,
              role: (member.is_owner ? 'admin' : member.role || 'viewer') as 'admin' | 'analyst' | 'viewer',
              joined_at: member.created_at || member.updated_at || new Date().toISOString(),
              user: {
                id: typeof member.user === 'number' ? member.user : 0,
                email: member.user_email || '',
                first_name: nameParts[0] || '',
                last_name: nameParts.slice(1).join(' ') || '',
                username: member.user_email?.split('@')[0] || '',
              }
            };
          })
        : [];
      setMembers(normalizedMembers);
    } catch (error: any) {
      let errorMessage = error.message || "Failed to fetch members";
      // Handle the specific "no access" error
      if (error.body?.error === "You do not have access to this platform") {
        errorMessage = "You don't have access to this workspace. Please select a valid workspace or create one.";
      }
      toast({ title: "Error loading data", description: errorMessage, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const loadSentInvitations = async () => {
    setLoadingSentInvites(true);
    try {
      const data = await apiService.getMyInvitations('sent');
      setSentInvitations(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast({ title: "Error loading invitations", description: error.message || "Failed to load sent invitations", variant: "destructive" });
    } finally {
      setLoadingSentInvites(false);
    }
  };

  useEffect(() => {
    loadData();
    loadSentInvitations();
  }, [selectedPlatformId]);

  const handleSendInvitation = async () => {
    if (!selectedPlatformId) {
      toast({ title: "Error", description: "Please select a platform first", variant: "destructive" });
      return;
    }
    if (!inviteEmail || !inviteEmail.includes('@')) {
      toast({ title: "Invalid email", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }
    setInviteLoading(true);
    try {
      const payload: any = {
        email: inviteEmail,
        role: inviteRole,
      };
      if (inviteRole === "org_member" && inviteWorkspaceIds.length > 0) {
        payload.workspace_ids = inviteWorkspaceIds;
      }
      await apiService.createOrganisationInvitation(payload);
      toast({ title: "Invitation sent", description: `Invitation sent to ${inviteEmail}` });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteMessage("");
      setInviteRole("org_member");
      setInviteWorkspaceIds([]);
      await loadSentInvitations();
    } catch (error: any) {
      toast({ title: "Error sending invitation", description: error.message || "Failed to send invitation", variant: "destructive" });
    } finally {
      setInviteLoading(false);
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancelInviteId) return;
    try {
      await apiService.cancelInvitation(cancelInviteId);
      toast({ title: "Invitation cancelled", description: "The invitation has been cancelled" });
      setCancelInviteId(null);
      await loadSentInvitations();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to cancel invitation", variant: "destructive" });
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedPlatformId || !removeMemberId) return;
    try {
      await apiService.removeMember(selectedPlatformId, removeMemberId);
      toast({ title: "Member removed", description: "The member has been removed from the platform" });
      setRemoveMemberId(null);
      await loadData();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to remove member", variant: "destructive" });
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin:   "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      analyst: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      viewer:  "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    };
    return colors[role] || "bg-slate-100 text-slate-700";
  };

  const getInviteStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending:  "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      accepted: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      expired:  "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
    };
    return colors[status] || "bg-slate-100 text-slate-700";
  };

  const getInitials = (first: string, last: string) =>
    `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || '??';

  const avatarColors = [
    "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300",
    "bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300",
    "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300",
    "bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300",
    "bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300",
  ];

  const statCards = [
    { label: "Team Members",  value: members.length,                                     icon: UsersIcon,  via: "via-blue-500/30",    iconBg: "bg-blue-50 dark:bg-blue-500/10",    iconColor: "text-blue-500",    border: "border-blue-200/50 dark:border-blue-800/30",    sub: `${sentInvitations.filter(i => i.status === 'pending').length} pending invitations` },
    { label: "Active Users",  value: members.length,                                     icon: CheckCircle,via: "via-green-500/30",   iconBg: "bg-green-50 dark:bg-green-500/10",  iconColor: "text-green-500",   border: "border-green-200/50 dark:border-green-800/30",   sub: "All members active"     },
    { label: "Admin Users",   value: members.filter(m => m.role === 'admin').length,      icon: Shield,     via: "via-red-500/30",     iconBg: "bg-red-50 dark:bg-red-500/10",      iconColor: "text-red-500",     border: "border-red-200/50 dark:border-red-800/30",       sub: "Full access granted"    },
    { label: "API Tokens",    value: 0,                                                   icon: Key,        via: "via-violet-500/30",  iconBg: "bg-violet-50 dark:bg-violet-500/10",iconColor: "text-violet-500",  border: "border-violet-200/50 dark:border-violet-800/30", sub: "Coming soon"            },
  ];

  const tabs = [
    { id: "members",     label: "Members",     icon: UsersIcon,   count: members.length },
    { id: "invitations", label: "Invitations", icon: Mail,        count: sentInvitations.filter(i => i.status === 'pending').length },
    { id: "tokens",      label: "API Tokens",  icon: Key,         count: null },
  ];

  // If no platform is selected, show a helpful message
  if (!selectedPlatformId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
              <UsersIcon className="h-8 w-8 text-blue-400" />
            </div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">No workspace selected</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              You don't have any workspaces yet. Create your first workspace to start using Heimdall.
            </p>
            <Button className="mt-4" onClick={() => window.location.href = '/platforms'}>
              Create Workspace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* ── Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Team Management
              </Badge>
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Access Control
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  Users & Teams
                </h1>
                <p className="mt-1 text-sm text-blue-100 max-w-xl">
                  Manage team members, roles, and API access tokens for your platform.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-sm"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Token
                </Button>
                <Dialog open={inviteDialogOpen} onOpenChange={async (open) => {
                  setInviteDialogOpen(open);
                  if (open) {
                    setLoadingWorkspaces(true);
                    try {
                      const workspaces = await apiService.getWorkspaces();
                      setAvailableWorkspaces(workspaces);
                    } catch (error) {
                      toast({ title: "Error", description: "Failed to load workspaces", variant: "destructive" });
                    } finally {
                      setLoadingWorkspaces(false);
                    }
                  } else {
                    setInviteEmail("");
                    setInviteMessage("");
                    setInviteRole("org_member");
                    setInviteWorkspaceIds([]);
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      disabled={!selectedPlatformId}
                      className="bg-white text-blue-700 hover:bg-white/90 shadow-md rounded-full px-4 text-sm font-semibold"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite User
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xl">
                    <DialogHeader className="border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                      <DialogTitle className="text-slate-900 dark:text-white">Invite Team Member</DialogTitle>
                      <DialogDescription className="text-slate-500 dark:text-slate-400">
                        Send an invitation to join your security team
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Email Address</Label>
                        <Input
                          type="email"
                          placeholder="user@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Role</Label>
                        <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as "org_admin" | "org_member")}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="org_admin">Organisation Admin – full access to all workspaces</SelectItem>
                            <SelectItem value="org_member">Organisation Member – access only to selected workspaces</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {inviteRole === "org_member" && (
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Workspace Access</Label>
                          {loadingWorkspaces ? (
                            <div className="text-sm text-muted-foreground">Loading workspaces...</div>
                          ) : availableWorkspaces.length === 0 ? (
                            <div className="text-sm text-muted-foreground">No workspaces available. Create one first.</div>
                          ) : (
                            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-2">
                              {availableWorkspaces.map((ws) => (
                                <div key={ws.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={ws.id}
                                    checked={inviteWorkspaceIds.includes(ws.id)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setInviteWorkspaceIds([...inviteWorkspaceIds, ws.id]);
                                      } else {
                                        setInviteWorkspaceIds(inviteWorkspaceIds.filter(id => id !== ws.id));
                                      }
                                    }}
                                  />
                                  <label htmlFor={ws.id} className="text-sm font-medium leading-none">
                                    {ws.name}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Message (Optional)</Label>
                        <Textarea
                          placeholder="Optional invitation message (max 500 characters)"
                          value={inviteMessage}
                          onChange={(e) => { if (e.target.value.length <= 500) setInviteMessage(e.target.value); }}
                          rows={3}
                          className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 resize-none"
                        />
                        <p className="text-xs text-slate-400 dark:text-slate-500">{inviteMessage.length}/500 characters</p>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                        <Button variant="outline" className="rounded-xl border-slate-200/70 dark:border-slate-700"
                          onClick={() => { setInviteDialogOpen(false); setInviteEmail(""); setInviteMessage(""); setInviteRole("org_member"); setInviteWorkspaceIds([]); }}>
                          Cancel
                        </Button>
                        <Button
                          disabled={inviteLoading || !inviteEmail}
                          onClick={handleSendInvitation}
                          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                        >
                          {inviteLoading ? "Sending..." : "Send Invitation"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.05 }}
        className="grid grid-cols-2 xl:grid-cols-4 gap-5"
      >
        {statCards.map(({ label, value, icon: Icon, via, iconBg, iconColor, border, sub }) => (
          <HoverCard key={label}>
            <Card className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm ${border}`}>
              <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${via} to-transparent`} />
              <CardHeader className="pb-2">
                <div className={`rounded-xl p-3 w-fit ${iconBg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  <AnimatedNumber value={value} />
                </div>
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{sub}</p>
              </CardContent>
            </Card>
          </HoverCard>
        ))}
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
        <div className="flex gap-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/60 dark:bg-slate-800/30 p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== null && (
                <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold ${
                  activeTab === id
                    ? "bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Members Tab ── */}
      {activeTab === "members" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2">
                  <UsersIcon className="h-4 w-4 text-blue-500" />
                </div>
                Platform Members
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <AnimatedNumber value={members.length} />
                </span>
              </CardTitle>
              <CardDescription>Manage members and their roles for the selected platform</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-4 h-14 w-14">
                    <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Loading members...</p>
                </div>
              ) : members.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <UsersIcon className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No members found</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invite team members to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {members.map((member, idx) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * idx }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${avatarColors[idx % avatarColors.length]}`}>
                          {getInitials(member.user.first_name, member.user.last_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">
                            {member.user.first_name} {member.user.last_name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{member.user.email || 'No email'}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Joined {new Date(member.joined_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={getRoleColor(member.role)}>{member.role}</Badge>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setRemoveMemberId(String(member.id))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/50 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Invitations Tab (sent by current user) ── */}
      {activeTab === "invitations" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="rounded-xl bg-cyan-50 dark:bg-cyan-500/10 p-2">
                  <Mail className="h-4 w-4 text-cyan-500" />
                </div>
                Sent Invitations
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <AnimatedNumber value={sentInvitations.filter(i => i.status === 'pending').length} />
                </span>
              </CardTitle>
              <CardDescription>Invitations you have sent to others</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loadingSentInvites ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="relative mb-4 h-14 w-14">
                    <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Loading invitations...</p>
                </div>
              ) : sentInvitations.length === 0 ? (
                <div className="text-center py-16 px-6">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Mail className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No invitations sent</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Invite team members to get started</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200/40 dark:divide-slate-800/40">
                  {sentInvitations.map((invitation, idx) => (
                    <motion.div
                      key={invitation.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 * idx }}
                      className="flex items-center justify-between px-5 py-4 hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-500/10 border border-cyan-200/50 dark:border-cyan-800/30">
                          <Mail className="h-4 w-4 text-cyan-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-900 dark:text-white">To: {invitation.email || 'Unknown'}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            Role: <span className="capitalize">{invitation.role === 'org_admin' ? 'Admin' : 'Member'}</span>
                          </p>
                          {invitation.organisation_name && (
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Organisation: {invitation.organisation_name}
                            </p>
                          )}
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            Sent: {new Date(invitation.created_at).toLocaleDateString()} · Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={getInviteStatusColor(invitation.status)}>{invitation.status}</Badge>
                        {invitation.status === 'pending' && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setCancelInviteId(invitation.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200/50 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── API Tokens Tab ── */}
      {activeTab === "tokens" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-2">
                      <Key className="h-4 w-4 text-violet-500" />
                    </div>
                    API Tokens
                  </CardTitle>
                  <CardDescription>Manage API access tokens for automated integrations</CardDescription>
                </div>
                <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-sm">
                  <Key className="h-4 w-4 mr-2" />
                  Generate Token
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-center py-16 px-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-500/10">
                  <Key className="h-8 w-8 text-violet-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">API Token Management</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ── Cancel Invitation Dialog ── */}
      <AlertDialogComponent open={cancelInviteId !== null} onOpenChange={(open) => !open && setCancelInviteId(null)}>
        <AlertDialogContentComponent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 dark:bg-slate-900">
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent className="text-slate-900 dark:text-white">Cancel Invitation</AlertDialogTitleComponent>
            <AlertDialogDescriptionComponent className="text-slate-500 dark:text-slate-400">
              Are you sure you want to cancel this invitation? This action cannot be undone.
            </AlertDialogDescriptionComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancelComponent className="rounded-xl border-slate-200/70 dark:border-slate-700" onClick={() => setCancelInviteId(null)}>
              Keep Invitation
            </AlertDialogCancelComponent>
            <AlertDialogActionComponent onClick={handleCancelInvitation} className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0">
              Cancel Invitation
            </AlertDialogActionComponent>
          </AlertDialogFooterComponent>
        </AlertDialogContentComponent>
      </AlertDialogComponent>

      {/* ── Remove Member Dialog ── */}
      <AlertDialogComponent open={removeMemberId !== null} onOpenChange={(open) => !open && setRemoveMemberId(null)}>
        <AlertDialogContentComponent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 dark:bg-slate-900">
          <AlertDialogHeaderComponent>
            <AlertDialogTitleComponent className="text-slate-900 dark:text-white">Remove Member</AlertDialogTitleComponent>
            <AlertDialogDescriptionComponent className="text-slate-500 dark:text-slate-400">
              Are you sure you want to remove this member? They will lose access immediately.
            </AlertDialogDescriptionComponent>
          </AlertDialogHeaderComponent>
          <AlertDialogFooterComponent>
            <AlertDialogCancelComponent className="rounded-xl border-slate-200/70 dark:border-slate-700" onClick={() => setRemoveMemberId(null)}>
              Keep Member
            </AlertDialogCancelComponent>
            <AlertDialogActionComponent onClick={handleRemoveMember} className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0">
              Remove Member
            </AlertDialogActionComponent>
          </AlertDialogFooterComponent>
        </AlertDialogContentComponent>
      </AlertDialogComponent>
    </div>
  );
};

export default Users;