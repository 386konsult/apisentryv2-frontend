import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  Filter,
  Eye,
  Clock,
  User,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const AuditLogs = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [resourceType, setResourceType] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [pageSize] = useState<number>(100);
  const [platform, setPlatform] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) {
      navigate("/platforms");
      return;
    }

    apiService.getPlatformDetails(platformId).then(setPlatform).catch(() => {});

    fetchAuditLogs();
  }, [page, searchTerm, resourceType, actionFilter, startDate, endDate, userFilter]);

  const fetchAuditLogs = async () => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) return;

    setLoading(true);
    try {
      const params: any = {
        platform_id: platformId,
        page: String(page),
        page_size: String(pageSize),
      };

      if (searchTerm) params.search = searchTerm;
      if (resourceType && resourceType !== "all") params.resource_type = resourceType;
      if (actionFilter && actionFilter !== "all") params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (userFilter) params.user = userFilter;

      const response = await apiService.getAuditLogs(params);

      let logsArray: any[] = [];
      if (Array.isArray(response)) {
        logsArray = response;
        setTotalPages(null);
      } else if (response && Array.isArray(response.results)) {
        logsArray = response.results;
        setTotalPages(response.total_pages || null);
      } else if (response && Array.isArray(response.audit_logs)) {
        logsArray = response.audit_logs;
        setTotalPages(response.total_pages || null);
      } else {
        logsArray = [];
        setTotalPages(null);
      }

      setAuditLogs(logsArray);
    } catch (error: any) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to fetch audit logs.",
        variant: "destructive",
      });
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleString();
    } catch {
      return "-";
    }
  };

  const getActionColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case "create":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "delete":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "read":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setResourceType("all");
    setActionFilter("all");
    setStartDate("");
    setEndDate("");
    setUserFilter("");
    setPage(1);
  };

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Audit Trail
              </Badge>
              {platform && (
                <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                  {platform.name}
                </Badge>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                      Audit Logs
                    </h1>
                    <p className="mt-1 text-sm text-blue-100 max-w-xl">
                      Track all user actions and system events across your platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
      >
        <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
          <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2">
                <Filter className="h-4 w-4 text-blue-500" />
              </div>
              Filters
            </CardTitle>
            <CardDescription>
              Search and narrow audit entries by resource, action, date range, and user.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            <div className="grid gap-4 xl:grid-cols-[1.4fr_180px_160px_160px_160px_160px_auto]">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-9 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                />
              </div>

              <Select
                value={resourceType}
                onValueChange={(value) => {
                  setResourceType(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Resource Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  <SelectItem value="alert">Alert</SelectItem>
                  <SelectItem value="incident">Incident</SelectItem>
                  <SelectItem value="waf_rule">WAF Rule</SelectItem>
                  <SelectItem value="endpoint">Endpoint</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="platform">Workspace</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={actionFilter}
                onValueChange={(value) => {
                  setActionFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
                  <Activity className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>

              <div className="min-w-[140px]">
                <Label className="text-xs text-slate-500 dark:text-slate-400">Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                />
              </div>

              <div className="min-w-[140px]">
                <Label className="text-xs text-slate-500 dark:text-slate-400">End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                />
              </div>

              <div className="min-w-[140px]">
                <Label className="text-xs text-slate-500 dark:text-slate-400">User ID</Label>
                <Input
                  placeholder="User ID"
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                />
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={handleResetFilters}
                  className="shrink-0 rounded-xl"
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
          <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <div className="rounded-xl bg-cyan-50 dark:bg-cyan-500/10 p-2">
                <FileText className="h-4 w-4 text-cyan-500" />
              </div>
              Audit Logs
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                {auditLogs.length}
              </span>
            </CardTitle>
            <CardDescription>
              View all audit log entries for this platform
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="relative mb-4 h-14 w-14">
                  <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300">Loading audit logs...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="text-center py-16 px-6">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">No audit logs found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Audit logs will appear here when actions are performed
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto max-h-[600px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                      <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                        <th className="px-3 py-3 text-left whitespace-nowrap min-w-[170px] font-semibold text-slate-600 dark:text-slate-300">
                          Timestamp
                        </th>
                        <th className="px-3 py-3 text-left whitespace-nowrap min-w-[140px] font-semibold text-slate-600 dark:text-slate-300">
                          User
                        </th>
                        <th className="px-3 py-3 text-left whitespace-nowrap min-w-[110px] font-semibold text-slate-600 dark:text-slate-300">
                          Action
                        </th>
                        <th className="px-3 py-3 text-left whitespace-nowrap min-w-[130px] font-semibold text-slate-600 dark:text-slate-300">
                          Resource Type
                        </th>
                        <th className="px-3 py-3 text-left whitespace-nowrap min-w-[220px] font-semibold text-slate-600 dark:text-slate-300">
                          Resource
                        </th>
                        <th className="px-3 py-3 text-left whitespace-nowrap min-w-[120px] font-semibold text-slate-600 dark:text-slate-300">
                          Details
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {auditLogs.map((log) => (
                        <tr
                          key={log.id}
                          className="border-b border-slate-200/40 hover:bg-blue-50/30 dark:border-slate-800/40 dark:hover:bg-slate-800/30 transition-colors"
                        >
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <Clock className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                              <span className="text-xs whitespace-nowrap text-slate-700 dark:text-slate-300">
                                {formatDate(log.timestamp || log.created_at || log.occurred_at)}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex items-center gap-2 min-w-0">
                              <User className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                              <span
                                className="text-xs truncate max-w-[120px] text-slate-700 dark:text-slate-300"
                                title={log.user_email || log.user_name || log.user_id || "-"}
                              >
                                {log.user_email || log.user_name || log.user_id || "-"}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <Badge className={`${getActionColor(log.action)} text-xs`}>
                              {log.action || "-"}
                            </Badge>
                          </td>

                          <td className="px-3 py-3">
                            <span
                              className="text-xs truncate max-w-[120px] text-slate-700 dark:text-slate-300"
                              title={log.resource_type || "-"}
                            >
                              {log.resource_type || "-"}
                            </span>
                          </td>

                          <td className="px-3 py-3">
                            <div className="min-w-0">
                              <div
                                className="font-medium truncate max-w-[220px] text-slate-900 dark:text-white"
                                title={log.resource_name || log.resource_id || "-"}
                              >
                                {log.resource_name || log.resource_id || "-"}
                              </div>
                              {log.resource_id && log.resource_id !== log.resource_name && (
                                <div
                                  className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[220px]"
                                  title={log.resource_id}
                                >
                                  ID: {log.resource_id}
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="px-3 py-3">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-xs rounded-lg">
                                  <Eye className="h-3.5 w-3.5 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>

                              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xl">
                                <DialogHeader className="border-b border-slate-200/50 dark:border-slate-800/50 pb-4">
                                  <DialogTitle className="text-slate-900 dark:text-white">
                                    Audit Log Details
                                  </DialogTitle>
                                  <DialogDescription className="text-slate-500 dark:text-slate-400">
                                    Complete information about this audit log entry
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 pt-2">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>Timestamp</Label>
                                      <p className="text-sm mt-2">
                                        {formatDate(log.timestamp || log.created_at || log.occurred_at)}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>User</Label>
                                      <p className="text-sm font-medium mt-2">
                                        {log.user_email || log.user_name || log.user_id || "-"}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>Action</Label>
                                      <div className="mt-2">
                                        <Badge className={getActionColor(log.action)}>
                                          {log.action || "-"}
                                        </Badge>
                                      </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>Resource Type</Label>
                                      <p className="text-sm mt-2">{log.resource_type || "-"}</p>
                                    </div>
                                  </div>

                                  {log.resource_id && (
                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>Resource ID</Label>
                                      <p className="text-sm font-mono mt-2">{log.resource_id}</p>
                                    </div>
                                  )}

                                  {log.resource_name && (
                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>Resource Name</Label>
                                      <p className="text-sm font-medium mt-2">{log.resource_name}</p>
                                    </div>
                                  )}

                                  {log.changes && Object.keys(log.changes).length > 0 && (
                                    <div>
                                      <Label>Changes</Label>
                                      <div className="bg-muted p-3 rounded-xl font-mono text-xs mt-2 overflow-x-auto">
                                        <pre className="whitespace-pre-wrap break-words">
                                          {JSON.stringify(log.changes, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}

                                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                                    <div>
                                      <Label>Metadata</Label>
                                      <div className="bg-muted p-3 rounded-xl font-mono text-xs mt-2 overflow-x-auto">
                                        <pre className="whitespace-pre-wrap break-words">
                                          {JSON.stringify(log.metadata, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}

                                  {log.ip_address && (
                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>IP Address</Label>
                                      <p className="text-sm font-mono mt-2">{log.ip_address}</p>
                                    </div>
                                  )}

                                  {log.user_agent && (
                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>User Agent</Label>
                                      <p className="text-sm mt-2">{log.user_agent}</p>
                                    </div>
                                  )}

                                  {log.description && (
                                    <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                                      <Label>Description</Label>
                                      <p className="text-sm mt-2">{log.description}</p>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages !== null && totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-4 border-t border-slate-200/60 dark:border-slate-800/60">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      Page {page} of {totalPages}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        disabled={page === 1 || loading}
                        className="rounded-xl"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((prev) => Math.min(totalPages || 1, prev + 1))}
                        disabled={page >= (totalPages || 1) || loading}
                        className="rounded-xl"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AuditLogs;
