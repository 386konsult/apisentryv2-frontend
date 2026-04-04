import React, { useEffect, useState } from "react";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Ban,
  Plus,
  Search,
  MapPin,
  Clock,
  User,
  Shield,
  MoreVertical,
  Trash2,
  Activity,
} from "lucide-react";
import { usePlatform } from "@/contexts/PlatformContext";

const IPBlacklist = () => {
  const platform = (usePlatform() as any).platform;
  const [platformName, setPlatformName] = useState<string | null>(null);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ip: any | null }>({
    open: false,
    ip: null,
  });
  const { toast } = useToast();

  const fetchBlacklist = async () => {
    setLoading(true);
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      const response = await apiService.getBlacklist(platformId);
      const respAny = response as any;
      const blacklistArray = Array.isArray(respAny) ? respAny : (respAny.results || respAny.data || []);
      setBlacklist(blacklistArray);
    } catch (error) {
      toast({
        title: "Error fetching blacklist",
        description: "Failed to load blacklist data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addIPToBlacklist = async () => {
    if (!newIP.trim()) {
      toast({
        title: "Invalid IP",
        description: "Please enter a valid IP address.",
        variant: "destructive",
      });
      return;
    }
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      await apiService.addToBlacklist({ platform_uuid: platformId, ip: newIP.trim() });
      toast({
        title: "IP Blacklisted",
        description: `${newIP.trim()} has been added to the blacklist.`,
        variant: "default",
      });
      setNewIP("");
      fetchBlacklist();
    } catch (error: any) {
      toast({
        title: "Error adding IP",
        description: error.message || "Failed to add IP to blacklist.",
        variant: "destructive",
      });
    }
  };

  const removeIPFromBlacklist = async (ipItem: any) => {
    try {
      await apiService.removeFromBlacklist(ipItem.id);
      toast({
        title: "IP Removed",
        description: `The IP ${ipItem.ip} has been removed from the blacklist.`,
        variant: "default",
      });
      setDeleteDialog({ open: false, ip: null });
      fetchBlacklist();
    } catch (error: any) {
      toast({
        title: "Error removing IP",
        description: error.message || "Failed to remove IP from blacklist.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "—";
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "—";
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  useEffect(() => {
    const fetchPlatformName = async () => {
      try {
        const platformId = localStorage.getItem("selected_platform_id");
        if (!platformId) throw new Error("No platform selected");
        const platformDetails = await apiService.getPlatformDetails(platformId);
        setPlatformName(platformDetails.name || "Unknown Platform");
      } catch {
        setPlatformName("Unknown Platform");
      }
    };
    fetchPlatformName();
  }, []);

  const filteredBlacklist = blacklist.filter((item) =>
    item.ip?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const recentlyAdded = blacklist.filter((item) => {
    const date = new Date(item.blocked_at || item.created_at || item.timestamp);
    return !isNaN(date.getTime()) && Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-rose-600 to-orange-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />

        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
              Security Control
            </Badge>
            {platformName && (
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                {platformName}
              </Badge>
            )}
          </div>

          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words">
                IP Blacklist
              </h1>
              <p className="mt-1 text-sm text-rose-100 break-words max-w-xl">
                Block malicious IP addresses and protect your API from unwanted traffic.
              </p>
            </div>

            {/* Action button */}
            <div className="shrink-0">
              <Button
                size="sm"
                className="bg-white text-rose-700 hover:bg-white/90 shadow-md rounded-full px-4 text-sm font-semibold"
                onClick={() => document.getElementById("add-ip-input")?.focus()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Block IP
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3">

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-rose-50 p-3 w-fit dark:bg-rose-500/10">
              <Shield className="h-5 w-5 text-rose-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Blocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{blacklist.length}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">IP addresses blocked</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-orange-50 p-3 w-fit dark:bg-orange-500/10">
              <Ban className="h-5 w-5 text-orange-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Active Blocks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{blacklist.length}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Currently enforced</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-amber-50 p-3 w-fit dark:bg-amber-500/10">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Added This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{recentlyAdded}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">New blocks in last 7 days</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Add IP Card ── */}
      <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
        <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
          <CardTitle className="text-slate-900 dark:text-white">Block an IP Address</CardTitle>
          <CardDescription>
            Enter an IP address to immediately deny all requests originating from it
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1 min-w-0">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                id="add-ip-input"
                placeholder="Enter IP address (e.g. 192.168.1.1)"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addIPToBlacklist(); }}
                className="pl-9 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 w-full"
              />
            </div>
            <Button
              onClick={addIPToBlacklist}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 px-5 shrink-0"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Blacklist
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Blocked IPs Table ── */}
      <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
        <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                Blocked IP Addresses
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-100 px-2 text-xs font-bold text-rose-700 dark:bg-rose-500/20 dark:text-rose-300">
                  {filteredBlacklist.length}
                </span>
              </CardTitle>
              <CardDescription>
                All IP addresses currently denied access to your platform
              </CardDescription>
            </div>
            <div className="relative flex-shrink-0 w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search IPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 w-full sm:w-[260px]"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4 h-14 w-14">
                <div className="absolute inset-0 rounded-full bg-rose-100 dark:bg-rose-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-rose-600 dark:border-t-rose-400 animate-spin" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Loading blacklist...</p>
            </div>
          ) : filteredBlacklist.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Ban className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                {searchTerm ? "No IPs match your search" : "No blocked IPs"}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {searchTerm ? "Try a different search term." : "Add an IP address above to start blocking traffic."}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="mt-4 rounded-xl"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto max-h-[640px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[200px]">IP Address</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[180px]">Blocked At</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[150px]">Blocked By</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[100px]">Status</th>
                      <th className="px-5 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[80px]">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlacklist.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-200/40 transition-colors hover:bg-rose-50/30 dark:border-slate-800/40 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-500/10">
                              <MapPin className="h-4 w-4 text-rose-500" />
                            </div>
                            <span className="font-mono text-sm font-medium text-slate-900 dark:text-white">
                              {item.ip}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                            <span className="text-xs">
                              {formatDate(item.blocked_at || item.created_at || item.timestamp)}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                              <User className="h-3 w-3 text-slate-500" />
                            </div>
                            <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                              {item.user_email || item.blocked_by || item.user || item.created_by || "System"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs">
                            Blocked
                          </Badge>
                        </td>
                        <td className="px-5 py-4 align-middle">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="rounded-lg h-8 w-8 p-0">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setDeleteDialog({ open: true, ip: item })}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove from Blacklist
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden p-4 space-y-3">
                {filteredBlacklist.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-500/10">
                          <MapPin className="h-4 w-4 text-rose-500" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white break-all">
                            {item.ip}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.user_email || item.blocked_by || item.user || item.created_by || "System"}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs shrink-0">
                        Blocked
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3 w-3 shrink-0" />
                      {formatDate(item.blocked_at || item.created_at || item.timestamp)}
                    </div>

                    <div className="mt-3 flex justify-end border-t border-slate-200/60 pt-3 dark:border-slate-700/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteDialog({ open: true, ip: item })}
                        className="rounded-lg text-destructive hover:text-destructive hover:bg-red-50 dark:hover:bg-red-900/20 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Delete Confirmation ── */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, ip: null })}>
        <AlertDialogContent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove IP from Blacklist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock{" "}
              <span className="font-mono font-semibold text-slate-900 dark:text-white">
                {deleteDialog.ip?.ip}
              </span>
              ? Requests from this address will be allowed through again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.ip && removeIPFromBlacklist(deleteDialog.ip)}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default IPBlacklist;
