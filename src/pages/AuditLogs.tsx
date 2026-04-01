import { useState, useEffect } from "react";
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
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) {
      navigate('/platforms');
      return;
    }

    // Fetch platform details
    apiService.getPlatformDetails(platformId).then(setPlatform).catch(() => {});

    fetchAuditLogs();
  }, [page, searchTerm, resourceType, actionFilter, startDate, endDate, userFilter]);

  const fetchAuditLogs = async () => {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) return;

    setLoading(true);
    try {
      const params: any = {
        platform_id: platformId,
        page: String(page),
        page_size: String(pageSize),
      };

      if (searchTerm) params.search = searchTerm;
      if (resourceType && resourceType !== 'all') params.resource_type = resourceType;
      if (actionFilter && actionFilter !== 'all') params.action = actionFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (userFilter) params.user = userFilter;

      const response = await apiService.getAuditLogs(params);

      // Handle different response formats
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
      console.error('Error fetching audit logs:', error);
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
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleString();
    } catch {
      return '-';
    }
  };

  const getActionColor = (action: string) => {
    switch (action?.toLowerCase()) {
      case 'create':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'update':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'delete':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'read':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800';
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
    <div className="space-y-6 p-4 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Audit Logs
            {platform && <span className="text-lg font-normal text-muted-foreground ml-2"> • {platform.name}</span>}
          </h1>
          <p className="text-muted-foreground">
            Track all user actions and system events
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1 w-full min-w-0">
              <div className="relative flex-1 max-w-sm w-full min-w-0">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="pl-8"
                />
              </div>

              <Select value={resourceType} onValueChange={(value) => {
                setResourceType(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[160px]">
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

              <Select value={actionFilter} onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}>
                <SelectTrigger className="w-full sm:w-[140px]">
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

              <div className="flex gap-2 items-center">
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs text-muted-foreground">Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <Label className="text-xs text-muted-foreground">End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPage(1);
                    }}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex-1 min-w-[140px]">
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <Input
                  placeholder="User ID"
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setPage(1);
                  }}
                  className="mt-1"
                />
              </div>

              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="shrink-0"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <CardDescription>
            View all audit log entries for this platform
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading audit logs...</p>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No audit logs found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Audit logs will appear here when actions are performed
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto" style={{ maxHeight: '600px' }}>
                <table className="w-full text-sm border-0">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left whitespace-nowrap min-w-[150px]">Timestamp</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">User</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap min-w-[100px]">Action</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Resource Type</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap min-w-[200px]">Resource</th>
                      <th className="px-3 py-2 text-left whitespace-nowrap min-w-[120px]">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <Clock className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs whitespace-nowrap">
                              {formatDate(log.timestamp || log.created_at || log.occurred_at)}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs truncate max-w-[120px]" title={log.user_email || log.user_name || log.user_id || '-'}>
                              {log.user_email || log.user_name || log.user_id || '-'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge className={`${getActionColor(log.action)} text-xs`}>
                            {log.action || '-'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <span className="text-xs truncate max-w-[120px]" title={log.resource_type || '-'}>
                            {log.resource_type || '-'}
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate max-w-[200px]" title={log.resource_name || log.resource_id || '-'}>
                              {log.resource_name || log.resource_id || '-'}
                            </div>
                            {log.resource_id && log.resource_id !== log.resource_name && (
                              <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={log.resource_id}>
                                ID: {log.resource_id}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Audit Log Details</DialogTitle>
                                <DialogDescription>
                                  Complete information about this audit log entry
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Timestamp</Label>
                                    <p className="text-sm">{formatDate(log.timestamp || log.created_at || log.occurred_at)}</p>
                                  </div>
                                  <div>
                                    <Label>User</Label>
                                    <p className="text-sm font-medium">{log.user_email || log.user_name || log.user_id || '-'}</p>
                                  </div>
                                  <div>
                                    <Label>Action</Label>
                                    <Badge className={getActionColor(log.action)}>
                                      {log.action || '-'}
                                    </Badge>
                                  </div>
                                  <div>
                                    <Label>Resource Type</Label>
                                    <p className="text-sm">{log.resource_type || '-'}</p>
                                  </div>
                                </div>

                                {log.resource_id && (
                                  <div>
                                    <Label>Resource ID</Label>
                                    <p className="text-sm font-mono">{log.resource_id}</p>
                                  </div>
                                )}

                                {log.resource_name && (
                                  <div>
                                    <Label>Resource Name</Label>
                                    <p className="text-sm font-medium">{log.resource_name}</p>
                                  </div>
                                )}

                                {log.changes && Object.keys(log.changes).length > 0 && (
                                  <div>
                                    <Label>Changes</Label>
                                    <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(log.changes, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div>
                                    <Label>Metadata</Label>
                                    <div className="bg-muted p-3 rounded font-mono text-xs mt-2 overflow-x-auto">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(log.metadata, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}

                                {log.ip_address && (
                                  <div>
                                    <Label>IP Address</Label>
                                    <p className="text-sm font-mono">{log.ip_address}</p>
                                  </div>
                                )}

                                {log.user_agent && (
                                  <div>
                                    <Label>User Agent</Label>
                                    <p className="text-sm">{log.user_agent}</p>
                                  </div>
                                )}

                                {log.description && (
                                  <div>
                                    <Label>Description</Label>
                                    <p className="text-sm">{log.description}</p>
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

              {/* Pagination */}
              {totalPages !== null && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <div className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(prev => Math.min(totalPages || 1, prev + 1))}
                      disabled={page >= (totalPages || 1) || loading}
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
    </div>
  );
};

export default AuditLogs;

