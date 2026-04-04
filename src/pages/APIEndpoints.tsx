import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
  Globe,
  Search,
  Filter,
  Plus,
  Settings,
  BarChart3,
  Shield,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { apiService, APIEndpoint, EndpointStatus } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const APIEndpoints = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformName, setPlatformName] = useState<string>("");
  const [trafficData, setTrafficData] = useState<Array<{ hour: string; requests: number }>>([]);
  const [endpointsAddedThisWeek, setEndpointsAddedThisWeek] = useState<number | null>(null);
  const [responseTimeChange, setResponseTimeChange] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const platformId = localStorage.getItem("selected_platform_id");
    if (!platformId) {
      navigate("/platforms");
      return;
    }

    const platforms = localStorage.getItem("user_platforms");
    if (platforms) {
      const arr = JSON.parse(platforms);
      const found = arr.find((p: any) => p.id === platformId);
      if (found) setPlatformName(found.name);
    }

    const fetchEndpoints = async () => {
      try {
        const res = await apiService.getPlatformEndpoints(platformId);
        const endpointsArr = Array.isArray(res) ? res : res.results || [];
        setEndpoints(endpointsArr);
        setEndpointStatus(
          endpointsArr.map((ep: any) => ({
            endpoint: ep,
            status: ep.status || "healthy",
            request_count: ep.request_count || 0,
            avg_response_time: ep.avg_response_time || 0,
            error_rate: ep.error_rate || 0,
            last_accessed: ep.last_accessed,
            protection: !!ep.is_protected,
            rules_applied: ep.rules_applied || 0,
          }))
        );
      } catch (error) {
        toast({
          title: "Error loading endpoints",
          description: "Failed to fetch API endpoints",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchTrafficData = async () => {
      try {
        const traffic = await apiService.getTrafficData();
        if (Array.isArray(traffic) && traffic.length > 0) {
          const transformed = traffic.map((item: any) => ({
            hour: item.name || item.hour || item.time || "",
            requests: item.requests || 0,
          }));
          setTrafficData(transformed);
        } else {
          setTrafficData([]);
        }
      } catch (error) {
        console.error("Error fetching traffic data:", error);
        setTrafficData([]);
      }
    };

    const fetchAnalytics = async () => {
      try {
        const analytics = await apiService.getAnalytics(platformId);
        if (analytics) {
          if (analytics.endpoints_added_this_week !== undefined) {
            setEndpointsAddedThisWeek(analytics.endpoints_added_this_week);
          }
          if (analytics.response_time_change !== undefined) {
            setResponseTimeChange(analytics.response_time_change);
          }
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchEndpoints();
    fetchTrafficData();
    fetchAnalytics();
  }, [toast, navigate]);

  const filteredEndpointStatus = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return endpointStatus.filter((status) => {
      const matchesSearch =
        query === "" ||
        status.endpoint.path?.toLowerCase().includes(query) ||
        status.endpoint.method?.toLowerCase().includes(query) ||
        status.endpoint.name?.toLowerCase().includes(query);

      const matchesStatus = statusFilter === "all" || status.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [endpointStatus, searchTerm, statusFilter]);

  const healthyCount = endpointStatus.filter((s) => s.status === "healthy").length;
  const protectedCount = endpointStatus.filter((s) => s.protection).length;
  const avgResponseTime =
    endpointStatus.length > 0
      ? endpointStatus.reduce((sum, s) => sum + s.avg_response_time, 0) / endpointStatus.length
      : 0;
  const totalRequests = endpointStatus.reduce((sum, s) => sum + s.request_count, 0);

  const getStatusColor = (status: string) => {
    const colors = {
      healthy: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-slate-500" />;
    }
  };

  const getMethodColor = (method: string) => {
    const colors = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[method as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
    
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />

    <div className="relative z-10 flex flex-col justify-between h-full gap-4">
      
      {/* Top row — badges */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
          Endpoint Observatory
        </Badge>

        {platformName && (
          <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
            {platformName}
          </Badge>
        )}
      </div>

      {/* Bottom row — title/desc left, buttons right */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        
        {/* Left */}
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words">
            API Endpoints
          </h1>
          <p className="mt-1 text-sm text-blue-100 break-words max-w-xl">
            Monitor endpoint health, traffic, protection coverage, and performance across your platform.
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-row gap-2 shrink-0">
          
          <Button
            variant="outline"
            size="sm"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-sm"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>

          <Dialog>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="bg-white text-blue-700 hover:bg-white/90 shadow-md rounded-full px-4 text-sm font-semibold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl rounded-2xl border border-slate-200/50 bg-white p-0 shadow-2xl dark:border-slate-800/50 dark:bg-slate-900">
                <DialogHeader className="border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-5">
                  <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-white">Add New Endpoint</DialogTitle>
                  <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
                    Register a new API endpoint for monitoring and protection
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Method</Label>
                      <Select>
                        <SelectTrigger className="rounded-xl border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GET">GET</SelectItem>
                          <SelectItem value="POST">POST</SelectItem>
                          <SelectItem value="PUT">PUT</SelectItem>
                          <SelectItem value="DELETE">DELETE</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="path" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Endpoint Path</Label>
                      <Input id="path" placeholder="/api/v1/resource" className="rounded-xl border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 placeholder:text-slate-400" />
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200/50 bg-slate-50/70 dark:border-slate-700/50 dark:bg-slate-800/30 p-4">
                    <div className="flex items-center space-x-2">
                      <Switch id="protection" />
                      <Label htmlFor="protection" className="text-sm text-slate-700 dark:text-slate-300">Enable Protection</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
                    <Button variant="outline" className="rounded-xl border-slate-200/50 dark:border-slate-700 text-sm">
                      Cancel
                    </Button>
                    <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-sm">
                      Add Endpoint
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
      </div>

      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-blue-50 p-3 w-fit dark:bg-blue-500/10">
              <Globe className="h-5 w-5 text-blue-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Endpoints
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{endpoints.length}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {endpointsAddedThisWeek !== null ? `${endpointsAddedThisWeek} added this week` : "Tracked routes"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-green-50 p-3 w-fit dark:bg-green-500/10">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Healthy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">{healthyCount}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {endpointStatus.length > 0
                ? `${((healthyCount / endpointStatus.length) * 100).toFixed(1)}% uptime`
                : "0% uptime"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-cyan-50 p-3 w-fit dark:bg-cyan-500/10">
              <Shield className="h-5 w-5 text-cyan-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Protected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{protectedCount}</div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {endpointStatus.length > 0
                ? `${((protectedCount / endpointStatus.length) * 100).toFixed(1)}% coverage`
                : "0% coverage"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent" />
          <CardHeader className="pb-2">
            <div className="rounded-xl bg-violet-50 p-3 w-fit dark:bg-violet-500/10">
              <Clock className="h-5 w-5 text-violet-500" />
            </div>
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Avg Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">
              {endpointStatus.length > 0 ? `${avgResponseTime.toFixed(0)}ms` : "0ms"}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {responseTimeChange !== null
                ? `${responseTimeChange >= 0 ? "+" : ""}${responseTimeChange.toFixed(0)}ms from last week`
                : `${totalRequests.toLocaleString()} total requests`}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
        <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
          <CardTitle className="text-slate-900 dark:text-white">API Traffic Overview</CardTitle>
          <CardDescription>
            Request volume across all endpoints over the last 24 hours
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {trafficData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trafficData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                <XAxis dataKey="hour" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,0.2)",
                    boxShadow: "0 12px 30px rgba(15,23,42,0.12)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="hsl(201 96% 32%)"
                  strokeWidth={3}
                  dot={{ fill: "hsl(201 96% 32%)", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[320px] flex-col items-center justify-center text-center">
              <div className="mb-4 rounded-full bg-slate-100 p-4 dark:bg-slate-800">
                <BarChart3 className="h-6 w-6 text-slate-400" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">No traffic data available</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Traffic charts will appear once request data is collected.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
        <CardContent className="p-6">
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Search by method, path, or endpoint name and narrow the results by health status.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.4fr_220px]">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search endpoints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="healthy">Healthy</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
        <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
            Endpoint Status
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {filteredEndpointStatus.length}
            </span>
          </CardTitle>
          <CardDescription>
            Monitor the health, traffic, and protection posture of your API endpoints
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-4 h-14 w-14">
                <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
              </div>
              <p className="font-medium text-slate-700 dark:text-slate-300">Loading endpoints...</p>
            </div>
          ) : filteredEndpointStatus.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <Globe className="h-8 w-8 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No endpoints found</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto max-h-[640px]">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                    <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[320px]">
                        Endpoint
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">
                        Requests
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">
                        Avg Response
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">
                        Error Rate
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[180px]">
                        Protection
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[180px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEndpointStatus.map((status) => (
                      <tr
                        key={status.endpoint.id}
                        className="border-b border-slate-200/40 transition-colors hover:bg-blue-50/40 dark:border-slate-800/40 dark:hover:bg-slate-800/30"
                      >
                        <td className="px-4 py-4 align-top">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status.status)}
                              <Badge className={getMethodColor(status.endpoint.method)}>
                                {status.endpoint.method}
                              </Badge>
                              <span
                                className="font-mono text-sm font-medium text-slate-900 dark:text-white truncate"
                                title={status.endpoint.path}
                              >
                                {status.endpoint.path}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                              {status.endpoint.name || "Unnamed endpoint"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                              Last accessed:{" "}
                              {status.last_accessed ? new Date(status.last_accessed).toLocaleString() : "Never"}
                            </p>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <Badge className={getStatusColor(status.status)}>
                            {status.status}
                          </Badge>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {status.request_count.toLocaleString()}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {status.avg_response_time.toFixed(1)}ms
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span className="font-medium text-slate-900 dark:text-white">
                            {status.error_rate.toFixed(2)}%
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="space-y-2">
                            <Badge
                              variant="outline"
                              className={
                                status.protection
                                  ? "border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
                                  : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300"
                              }
                            >
                              {status.protection ? "Protected" : "Unprotected"}
                            </Badge>

                            <div className="flex items-center gap-2">
                              <Switch checked={status.protection} disabled />
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {status.rules_applied} rule{status.rules_applied === 1 ? "" : "s"} applied
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/api-endpoints/${status.endpoint.id}/analytics`)}
                              className="rounded-lg"
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </Button>
                            <Button variant="ghost" size="sm" className="rounded-lg">
                              <Settings className="h-4 w-4 mr-2" />
                              Configure
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden p-4 space-y-3">
                {filteredEndpointStatus.map((status) => (
                  <div
                    key={status.endpoint.id}
                    className="rounded-2xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-slate-700/60 dark:bg-slate-800/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          {getStatusIcon(status.status)}
                          <Badge className={getMethodColor(status.endpoint.method)}>
                            {status.endpoint.method}
                          </Badge>
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-white break-all">
                            {status.endpoint.path}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                          {status.endpoint.name || "Unnamed endpoint"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          Last accessed:{" "}
                          {status.last_accessed ? new Date(status.last_accessed).toLocaleString() : "Never"}
                        </p>
                      </div>

                      <Badge className={getStatusColor(status.status)}>{status.status}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Requests</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {status.request_count.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Avg Response</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {status.avg_response_time.toFixed(1)}ms
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Error Rate</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {status.error_rate.toFixed(2)}%
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                        <p className="text-xs text-slate-500 dark:text-slate-400">Rules Applied</p>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {status.rules_applied}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={
                          status.protection
                            ? "border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
                            : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300"
                        }
                      >
                        {status.protection ? "Protected" : "Unprotected"}
                      </Badge>

                      <div className="flex items-center gap-2">
                        <Switch checked={status.protection} disabled />
                        <Label className="text-xs text-slate-500 dark:text-slate-400">
                          Protection enabled
                        </Label>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/api-endpoints/${status.endpoint.id}/analytics`)}
                        className="rounded-lg"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analytics
                      </Button>
                      <Button variant="ghost" size="sm" className="rounded-lg">
                        <Settings className="h-4 w-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default APIEndpoints;
