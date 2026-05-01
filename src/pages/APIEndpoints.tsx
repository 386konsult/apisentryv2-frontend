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
  DialogClose,
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
import { motion } from "framer-motion";
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
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        {/* Header – gradient banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  Endpoint Observatory
                </span>
                {platformName && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                    {platformName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">
                API Endpoints
              </h1>
              <p className="text-sm text-blue-100 max-w-xl">
                Monitor endpoint health, traffic, protection coverage, and performance across your platform.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Analytics
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="rounded-full bg-white px-5 py-2 text-blue-600 font-medium hover:bg-white/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Endpoint
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl dark:border-slate-800/60 dark:bg-slate-900">
                  <DialogHeader className="border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-5">
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
                          <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
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
                        <Input id="path" placeholder="/api/v1/resource" className="rounded-xl border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 dark:border-slate-700/70 dark:bg-slate-800/30 p-4">
                      <div className="flex items-center space-x-2">
                        <Switch id="protection" />
                        <Label htmlFor="protection" className="text-sm text-slate-700 dark:text-slate-300">Enable Protection</Label>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-200/70 dark:border-slate-800/70 pt-4">
                      <DialogClose asChild>
                        <Button variant="outline" className="rounded-xl border-slate-200/70 dark:border-slate-700">Cancel</Button>
                      </DialogClose>
                      <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20">Add Endpoint</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards (4 cards) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                  <Globe className="h-5 w-5 text-blue-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-4">Total Endpoints</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{endpoints.length}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {endpointsAddedThisWeek !== null ? `${endpointsAddedThisWeek} added this week` : "Tracked routes"}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-700" style={{ width: endpoints.length > 0 ? "100%" : "0%" }} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-4">Healthy</p>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400">{healthyCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {endpointStatus.length > 0 ? `${((healthyCount / endpointStatus.length) * 100).toFixed(1)}% uptime` : "0% uptime"}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-700" style={{ width: endpointStatus.length > 0 ? `${(healthyCount / endpointStatus.length) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-500/10">
                  <Shield className="h-5 w-5 text-cyan-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-4">Protected</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{protectedCount}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {endpointStatus.length > 0 ? `${((protectedCount / endpointStatus.length) * 100).toFixed(1)}% coverage` : "0% coverage"}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-700" style={{ width: endpointStatus.length > 0 ? `${(protectedCount / endpointStatus.length) * 100}%` : "0%" }} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-500/10">
                  <Clock className="h-5 w-5 text-violet-500" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-4">Avg Response</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {endpointStatus.length > 0 ? `${avgResponseTime.toFixed(0)}ms` : "0ms"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {responseTimeChange !== null
                  ? `${responseTimeChange >= 0 ? "+" : ""}${responseTimeChange.toFixed(0)}ms from last week`
                  : `${totalRequests.toLocaleString()} total requests`}
              </p>
              <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                <div className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-700" style={{ width: avgResponseTime > 0 ? `${Math.min(100, (avgResponseTime / 1000) * 100)}%` : "0%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Chart Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Traffic Overview</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Request volume across all endpoints over the last 24 hours</p>
          </div>
          <div className="p-6">
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
                <div className="mb-4 rounded-full bg-slate-100 dark:bg-slate-800 p-4">
                  <BarChart3 className="h-6 w-6 text-slate-400" />
                </div>
                <p className="font-medium text-slate-700 dark:text-slate-300">No traffic data available</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Traffic charts will appear once request data is collected.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Search by method, path, or endpoint name and narrow the results by health status.
              </p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1.4fr_220px]">
            <div className="relative min-w-0">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search endpoints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
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

        {/* Endpoint Status Table Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Endpoint Status
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                {filteredEndpointStatus.length}
              </span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Monitor the health, traffic, and protection posture of your API endpoints
            </p>
          </div>

          <div className="p-0">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredEndpointStatus.length === 0 ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <Globe className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">No endpoints found</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto max-h-[640px]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                      <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[320px]">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[120px]">Requests</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[130px]">Avg Response</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[110px]">Error Rate</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[180px]">Protection</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[180px]">Actions</th>
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
                                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white truncate" title={status.endpoint.path}>
                                  {status.endpoint.path}
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                                {status.endpoint.name || "Unnamed endpoint"}
                              </p>
                              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                Last accessed: {status.last_accessed ? new Date(status.last_accessed).toLocaleString() : "Never"}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <Badge className={getStatusColor(status.status)}>{status.status}</Badge>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className="font-medium text-slate-900 dark:text-white">{status.request_count.toLocaleString()}</span>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className="font-medium text-slate-900 dark:text-white">{status.avg_response_time.toFixed(1)}ms</span>
                          </td>
                          <td className="px-4 py-4 align-top">
                            <span className="font-medium text-slate-900 dark:text-white">{status.error_rate.toFixed(2)}%</span>
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
                                onClick={() => navigate(`/endpoint-analytics/${status.endpoint.id}`)}
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

                {/* Mobile cards */}
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
                            <Badge className={getMethodColor(status.endpoint.method)}>{status.endpoint.method}</Badge>
                            <span className="font-mono text-sm font-medium text-slate-900 dark:text-white break-all">
                              {status.endpoint.path}
                            </span>
                          </div>
                          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                            {status.endpoint.name || "Unnamed endpoint"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Last accessed: {status.last_accessed ? new Date(status.last_accessed).toLocaleString() : "Never"}
                          </p>
                        </div>
                        <Badge className={getStatusColor(status.status)}>{status.status}</Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Requests</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{status.request_count.toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Avg Response</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{status.avg_response_time.toFixed(1)}ms</p>
                        </div>
                        <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Error Rate</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{status.error_rate.toFixed(2)}%</p>
                        </div>
                        <div className="rounded-xl border border-slate-200/60 bg-white/80 p-3 dark:border-slate-700/60 dark:bg-slate-900/50">
                          <p className="text-xs text-slate-500 dark:text-slate-400">Rules Applied</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">{status.rules_applied}</p>
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
                          <Label className="text-xs text-slate-500 dark:text-slate-400">Protection enabled</Label>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-200/60 pt-4 dark:border-slate-700/60">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/endpoint-analytics/${status.endpoint.id}`)}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIEndpoints;