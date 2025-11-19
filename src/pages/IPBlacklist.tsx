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
      // Handle both array and object with results property
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
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "-";
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

  return (
    <div className="space-y-6 w-full min-w-0 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">
            IP Blacklist
            {platformName && (
              <span className="text-base sm:text-lg font-normal text-muted-foreground ml-2 break-words">
                • {platformName}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground break-words">
            Manage blocked IP addresses to protect your API
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Blocked</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blacklist.length}</div>
            <p className="text-xs text-muted-foreground">IP addresses blocked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Blocks</CardTitle>
            <Ban className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{blacklist.length}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{platformName || "Unknown Platform"}</div>
            <p className="text-xs text-muted-foreground">Current platform</p>
          </CardContent>
        </Card>
      </div>

      {/* Add IP Section */}
      <Card>
        <CardHeader>
          <CardTitle>Add IP to Blacklist</CardTitle>
          <CardDescription>Enter an IP address to block all requests from it</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative flex-1 w-full min-w-0">
              <Input
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                value={newIP}
                onChange={(e) => setNewIP(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addIPToBlacklist();
                  }
                }}
                className="w-full min-w-0"
              />
            </div>
            <Button onClick={addIPToBlacklist} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add to Blacklist
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blacklist Table */}
      <Card className="min-w-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <CardTitle>Blocked IP Addresses ({filteredBlacklist.length})</CardTitle>
              <CardDescription>
                List of all IP addresses currently blocked
              </CardDescription>
            </div>
            <div className="relative flex-shrink-0 w-full sm:w-auto">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IPs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full sm:w-[250px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading blacklist...</p>
            </div>
          ) : filteredBlacklist.length === 0 ? (
            <div className="text-center py-12">
              <Ban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                {searchTerm ? "No IPs match your search" : "No blacklisted IPs found."}
              </p>
              {searchTerm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="mt-4"
                >
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: "600px" }}>
              <table className="w-full text-sm border-0">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[180px]">IP Address</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[150px]">Blocked At</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Blocked By</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Status</th>
                    <th className="px-3 py-2 text-left whitespace-nowrap min-w-[80px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBlacklist.map((item) => (
                    <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                          <span className="font-mono text-sm truncate max-w-[160px]" title={item.ip}>
                            {item.ip}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Clock className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs truncate max-w-[130px]" title={formatDate(item.blocked_at || item.created_at || item.timestamp)}>
                            {formatDate(item.blocked_at || item.created_at || item.timestamp)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs truncate max-w-[100px]" title={item.user_email || item.blocked_by || item.user || item.created_by || "System"}>
                            {item.user_email || item.blocked_by || item.user || item.created_by || "System"}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <Badge variant="destructive" className="text-xs">
                          Blocked
                        </Badge>
                      </td>
                      <td className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDeleteDialog({ open: true, ip: item })}
                              className="text-destructive"
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
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, ip: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove IP from Blacklist?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-mono font-semibold">{deleteDialog.ip?.ip}</span> from the blacklist? 
              This will allow requests from this IP address to reach your API again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.ip && removeIPFromBlacklist(deleteDialog.ip)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
