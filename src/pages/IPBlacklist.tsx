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
} from "lucide-react";
import { motion } from "framer-motion";

const IPBlacklist = () => {
  const [platformName, setPlatformName] = useState<string | null>(null);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIP, setNewIP] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ip: any | null; id: string | null }>({
    open: false,
    ip: null,
    id: null,
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
      console.log("Fetched blacklist:", blacklistArray); // Debug log
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

  const removeIPFromBlacklist = async () => {
    const idToDelete = deleteDialog.id;
    const ipToDelete = deleteDialog.ip?.ip || deleteDialog.ip;
    
    console.log("Removing IP with ID:", idToDelete);
    console.log("IP address:", ipToDelete);
    
    if (!idToDelete) {
      toast({
        title: "Error removing IP",
        description: "No ID found for this IP entry.",
        variant: "destructive",
      });
      setDeleteDialog({ open: false, ip: null, id: null });
      return;
    }
    
    try {
      await apiService.removeFromBlacklist(idToDelete);
      toast({
        title: "IP Removed",
        description: `IP has been removed from the blacklist.`,
        variant: "default",
      });
      setDeleteDialog({ open: false, ip: null, id: null });
      fetchBlacklist();
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Error removing IP",
        description: error.message || "Failed to remove IP from blacklist.",
        variant: "destructive",
      });
      setDeleteDialog({ open: false, ip: null, id: null });
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
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">

        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  Security Control
                </span>
                {platformName && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {platformName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">
                IP Blacklist
              </h1>
              <p className="text-sm text-blue-100 max-w-xl">
                Block malicious IP addresses and protect your API from unwanted traffic.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
                onClick={() => document.getElementById("add-ip-input")?.focus()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Block IP
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
        >
          <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <div className="rounded-xl bg-blue-50 p-3 w-fit dark:bg-blue-500/10">
                <Shield className="h-5 w-5 text-blue-500" />
              </div>
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Total Blocked
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 dark:text-white">{blacklist.length}</div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">IP addresses blocked</p>
              <div className="mt-4 h-1.5 rounded-full bg-blue-50 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700" style={{ width: blacklist.length > 0 ? "100%" : "0%" }} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
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
              <div className="mt-4 h-1.5 rounded-full bg-orange-50 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-orange-500 transition-all duration-700" style={{ width: blacklist.length > 0 ? "100%" : "0%" }} />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
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
              <div className="mt-4 h-1.5 rounded-full bg-amber-50 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-amber-500 transition-all duration-700" style={{ width: recentlyAdded > 0 ? "100%" : "0%" }} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add IP Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/80 dark:from-slate-800/30">
              <CardTitle className="text-slate-900 dark:text-white">Block an IP Address</CardTitle>
              <CardDescription>Enter an IP address to immediately deny all requests originating from it</CardDescription>
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
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 px-5 shrink-0"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add to Blacklist
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Blocked IPs Table Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-900">
            <CardHeader className="border-b border-slate-200/70 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/80 dark:from-slate-800/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                    Blocked IP Addresses
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {filteredBlacklist.length}
                    </span>
                  </CardTitle>
                  <CardDescription>All IP addresses currently denied access to your platform</CardDescription>
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
                    <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
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
                            key={item.id || item.ip_id || item.pk}
                            className="border-b border-slate-200/40 transition-colors hover:bg-blue-50/30 dark:border-slate-800/40 dark:hover:bg-slate-800/30"
                          >
                            <td className="px-5 py-4 align-middle">
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10">
                                  <MapPin className="h-4 w-4 text-blue-500" />
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
                                    onClick={() => {
                                      console.log("Delete clicked for item:", item);
                                      const deleteId = item.id || item.ip_id || item.pk;
                                      console.log("Using ID:", deleteId);
                                      setDeleteDialog({ 
                                        open: true, 
                                        ip: item,
                                        id: deleteId
                                      });
                                    }}
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
                        key={item.id || item.ip_id || item.pk}
                        className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                              <MapPin className="h-4 w-4 text-blue-500" />
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
                            onClick={() => {
                              const deleteId = item.id || item.ip_id || item.pk;
                              setDeleteDialog({ 
                                open: true, 
                                ip: item,
                                id: deleteId
                              });
                            }}
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
        </motion.div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
          if (!open) setDeleteDialog({ open: false, ip: null, id: null });
        }}>
          <AlertDialogContent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
            <AlertDialogHeader>
              <AlertDialogTitle>Remove IP from Blacklist?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to unblock{" "}
                <span className="font-mono font-semibold text-slate-900 dark:text-white">
                  {deleteDialog.ip?.ip || deleteDialog.ip}
                </span>
                ? Requests from this address will be allowed through again.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => removeIPFromBlacklist()}
                className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default IPBlacklist;