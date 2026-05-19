import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogClose, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Globe, Search, Filter, Plus, Settings, BarChart3, Shield,
  Activity, AlertCircle, CheckCircle, Clock, EyeOff, Ban,
  FileText, RefreshCw, AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { apiService, APIEndpoint, EndpointStatus } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

type Tab = "all" | "shadow";

const APIEndpoints = () => {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [shadowEndpoints, setShadowEndpoints] = useState<APIEndpoint[]>([]);
  const [endpointStatus, setEndpointStatus] = useState<EndpointStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [shadowLoading, setShadowLoading] = useState(false);
  const [platformName, setPlatformName] = useState<string>("");
  const [trafficData, setTrafficData] = useState<Array<{ hour: string; requests: number }>>([]);
  const [endpointsAddedThisWeek, setEndpointsAddedThisWeek] = useState<number | null>(null);
  const [responseTimeChange, setResponseTimeChange] = useState<number | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const platformId = localStorage.getItem("selected_platform_id") || "";

  const fetchEndpoints = useCallback(async () => {
    if (!platformId) return;
    try {
      const res = await apiService.getPlatformEndpoints(platformId);
      const endpointsArr: APIEndpoint[] = Array.isArray(res) ? res : res.results || [];
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
    } catch {
      toast({ title: "Error loading endpoints", description: "Failed to fetch API endpoints", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [platformId, toast]);

  const fetchShadowEndpoints = useCallback(async () => {
  if (!platformId) return;
  setShadowLoading(true);
  try {
    const token = localStorage.getItem("auth_token");
    const baseUrl = import.meta.env.VITE_API_URL || "https://staging.breachnet.io/api/v1";
    const res = await fetch(
      `${baseUrl}/platforms/${platformId}/endpoints/?is_shadow=true`,
      { headers: token ? { Authorization: `Token ${token}` } : {} }
    );
    const data = await res.json();
    const arr = Array.isArray(data) ? data : data.results || [];
    setShadowEndpoints(arr);
  } catch {
    setShadowEndpoints([]);
  } finally {
    setShadowLoading(false);
  }
}, [platformId]);

  useEffect(() => {
    if (!platformId) { navigate("/platforms"); return; }

    const platforms = localStorage.getItem("user_platforms");
    if (platforms) {
      try {
        const arr = JSON.parse(platforms);
        const found = arr.find((p: any) => p.id === platformId);
        if (found) setPlatformName(found.name);
      } catch {}
    }

    fetchEndpoints();

    // Traffic
    apiService.getTrafficData().then((traffic: any) => {
      if (Array.isArray(traffic) && traffic.length > 0) {
        setTrafficData(traffic.map((item: any) => ({ hour: item.name || item.hour || "", requests: item.requests || 0 })));
      }
    }).catch(() => {});

    // Analytics
    apiService.getAnalytics(platformId).then((analytics: any) => {
      if (analytics?.endpoints_added_this_week !== undefined) setEndpointsAddedThisWeek(analytics.endpoints_added_this_week);
      if (analytics?.response_time_change !== undefined) setResponseTimeChange(analytics.response_time_change);
    }).catch(() => {});
  }, [platformId, navigate, fetchEndpoints]);

  // Fetch shadow endpoints when that tab is selected
  useEffect(() => {
    if (activeTab === "shadow") fetchShadowEndpoints();
  }, [activeTab, fetchShadowEndpoints]);

  const filteredEndpointStatus = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return endpointStatus.filter((s) => {
      const matchSearch = !q || s.endpoint.path?.toLowerCase().includes(q) || s.endpoint.method?.toLowerCase().includes(q) || s.endpoint.name?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "all" || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [endpointStatus, searchTerm, statusFilter]);

  const filteredShadow = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return shadowEndpoints.filter((ep: any) =>
      !q || ep.path?.toLowerCase().includes(q) || ep.method?.toLowerCase().includes(q) || ep.name?.toLowerCase().includes(q)
    );
  }, [shadowEndpoints, searchTerm]);

  const healthyCount = endpointStatus.filter((s) => s.status === "healthy").length;
  const protectedCount = endpointStatus.filter((s) => s.protection).length;
  const avgResponseTime = endpointStatus.length > 0 ? endpointStatus.reduce((sum, s) => sum + s.avg_response_time, 0) / endpointStatus.length : 0;
  const totalRequests = endpointStatus.reduce((sum, s) => sum + s.request_count, 0);

  const getStatusColor = (status: string) => ({ healthy: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400", error: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" }[status] || "bg-gray-100 text-gray-800");

  const getStatusIcon = (status: string) => ({ healthy: <CheckCircle className="h-4 w-4 text-green-500" />, warning: <AlertCircle className="h-4 w-4 text-yellow-500" />, error: <AlertCircle className="h-4 w-4 text-red-500" /> }[status] || <Activity className="h-4 w-4 text-slate-500" />);

  const getMethodColor = (method: string) => ({ GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400", POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400", PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400", DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400", PATCH: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400" }[method] || "bg-gray-100 text-gray-800");

  const handleBlockEndpoint = async (ep: any) => {
    try {
      await apiService.request("/blacklist/", {
        method: "POST",
        body: JSON.stringify({ platform: platformId, ip: ep.path, reason: `Shadow endpoint blocked: ${ep.method} ${ep.path}` }),
      });
      toast({ title: "Endpoint blocked", description: `${ep.method} ${ep.path} added to blocklist.` });
    } catch {
      toast({ title: "Failed to block", description: "Could not block this endpoint.", variant: "destructive" });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              {platformName && (
                <div className="mb-4">
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium">{platformName}</span>
                </div>
              )}
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-3">API Endpoints</h1>
              <p className="text-sm text-blue-100 max-w-xl">Monitor endpoint health, traffic, protection coverage, and discover undocumented shadow APIs.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white">
                <BarChart3 className="mr-2 h-4 w-4" /> Analytics
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-full bg-white px-5 py-2 text-blue-600 font-medium hover:bg-white/90">
                    <Plus className="mr-2 h-4 w-4" /> Add Endpoint
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl rounded-2xl border border-slate-200/60 bg-white p-0 shadow-2xl dark:border-slate-800/60 dark:bg-slate-900">
                  <DialogHeader className="border-b border-slate-200/60 dark:border-slate-800/60 px-6 py-5">
                    <DialogTitle className="text-xl font-semibold">Add New Endpoint</DialogTitle>
                    <DialogDescription>Register a new API endpoint for monitoring and protection</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Method</Label>
                        <Select><SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"><SelectValue placeholder="Select method" /></SelectTrigger><SelectContent><SelectItem value="GET">GET</SelectItem><SelectItem value="POST">POST</SelectItem><SelectItem value="PUT">PUT</SelectItem><SelectItem value="DELETE">DELETE</SelectItem></SelectContent></Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Endpoint Path</Label>
                        <Input placeholder="/api/v1/resource" className="rounded-xl border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" />
                      </div>
                    </div>
                    <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 dark:border-slate-700/70 dark:bg-slate-800/30 p-4">
                      <div className="flex items-center space-x-2"><Switch id="protection" /><Label htmlFor="protection" className="text-sm">Enable Protection</Label></div>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-200/70 dark:border-slate-800/70 pt-4">
                      <DialogClose asChild><Button variant="outline" className="rounded-xl">Cancel</Button></DialogClose>
                      <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">Add Endpoint</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Endpoints", value: endpoints.length, sub: endpointsAddedThisWeek !== null ? `${endpointsAddedThisWeek} added this week` : "Tracked routes", icon: <Globe className="h-5 w-5 text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-500/10", bar: "from-blue-500 to-cyan-500", width: endpoints.length > 0 ? "100%" : "0%" },
            { label: "Shadow / Undocumented", value: shadowEndpoints.length || "—", sub: "Detected by WAF passive scan", icon: <EyeOff className="h-5 w-5 text-amber-500" />, bg: "bg-amber-50 dark:bg-amber-500/10", bar: "from-amber-500 to-orange-500", width: "60%", onClick: () => setActiveTab("shadow") },
            { label: "Protected", value: protectedCount, sub: endpointStatus.length > 0 ? `${((protectedCount / endpointStatus.length) * 100).toFixed(1)}% coverage` : "0% coverage", icon: <Shield className="h-5 w-5 text-cyan-500" />, bg: "bg-cyan-50 dark:bg-cyan-500/10", bar: "from-cyan-500 to-blue-500", width: endpointStatus.length > 0 ? `${(protectedCount / endpointStatus.length) * 100}%` : "0%" },
            { label: "Avg Response", value: endpointStatus.length > 0 ? `${avgResponseTime.toFixed(0)}ms` : "0ms", sub: responseTimeChange !== null ? `${responseTimeChange >= 0 ? "+" : ""}${responseTimeChange.toFixed(0)}ms from last week` : `${totalRequests.toLocaleString()} total requests`, icon: <Clock className="h-5 w-5 text-violet-500" />, bg: "bg-violet-50 dark:bg-violet-500/10", bar: "from-violet-500 to-purple-500", width: avgResponseTime > 0 ? `${Math.min(100, (avgResponseTime / 1000) * 100)}%` : "0%" },
          ].map((stat, i) => (
            <div key={i} onClick={stat.onClick} className={`bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden ${stat.onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
              <div className="p-6">
                <div className={`p-3 rounded-xl w-fit ${stat.bg}`}>{stat.icon}</div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-4">{stat.label}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-2">{stat.sub}</p>
                <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className={`h-1.5 rounded-full bg-gradient-to-r ${stat.bar} transition-all duration-700`} style={{ width: stat.width }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 rounded-2xl w-fit">
          <button onClick={() => setActiveTab("all")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "all" ? "bg-blue-600 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            <Globe className="h-4 w-4" /> All Endpoints
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "all" ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>{endpoints.length}</span>
          </button>
          <button onClick={() => setActiveTab("shadow")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeTab === "shadow" ? "bg-amber-500 text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
            <EyeOff className="h-4 w-4" /> Shadow / Undocumented
            {shadowEndpoints.length > 0 && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeTab === "shadow" ? "bg-white/20 text-white" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>{shadowEndpoints.length}</span>
            )}
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "all" && (
            <motion.div key="all" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">

              {/* Traffic Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
                <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">API Traffic Overview</h3>
                  <p className="text-sm text-slate-500">Request volume across all endpoints over the last 24 hours</p>
                </div>
                <div className="p-6">
                  {trafficData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <LineChart data={trafficData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.25)" />
                        <XAxis dataKey="hour" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid rgba(148,163,184,0.2)", boxShadow: "0 8px 24px rgba(15,23,42,0.1)" }} />
                        <Line type="monotone" dataKey="requests" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-[280px] flex-col items-center justify-center text-center">
                      <div className="mb-4 rounded-full bg-slate-100 dark:bg-slate-800 p-4"><BarChart3 className="h-6 w-6 text-slate-400" /></div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">No traffic data yet</p>
                      <p className="mt-1 text-sm text-slate-500">Traffic charts appear once request data is collected.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Filters */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl p-6 space-y-4">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_220px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search endpoints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                      <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Status" />
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

              {/* Endpoints Table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
                <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      Endpoint Status
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 px-2 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">{filteredEndpointStatus.length}</span>
                    </h3>
                    <p className="text-sm text-slate-500">Monitor health, traffic, and protection posture</p>
                  </div>
                  <button onClick={fetchEndpoints} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <RefreshCw className="h-4 w-4 text-slate-400" />
                  </button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
                ) : filteredEndpointStatus.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800"><Globe className="h-8 w-8 text-slate-400" /></div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No endpoints found</p>
                    <p className="mt-1 text-sm text-slate-500">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[640px]">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur dark:bg-slate-900/95">
                        <tr className="border-b border-slate-200/60 dark:border-slate-800/60">
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[300px]">Endpoint</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Requests</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Avg Response</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Error Rate</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Protection</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEndpointStatus.map((s) => (
                          <tr key={s.endpoint.id} className="border-b border-slate-200/40 hover:bg-blue-50/40 dark:border-slate-800/40 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 mb-1">
                                {getStatusIcon(s.status)}
                                <Badge className={getMethodColor(s.endpoint.method)}>{s.endpoint.method}</Badge>
                                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white truncate max-w-[200px]" title={s.endpoint.path}>{s.endpoint.path}</span>
                              </div>
                              <p className="text-xs text-slate-500 pl-6">{s.endpoint.name || "Unnamed endpoint"}</p>
                            </td>
                            <td className="px-4 py-4"><Badge className={getStatusColor(s.status)}>{s.status}</Badge></td>
                            <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{s.request_count.toLocaleString()}</td>
                            <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{s.avg_response_time.toFixed(1)}ms</td>
                            <td className="px-4 py-4 font-medium text-slate-900 dark:text-white">{s.error_rate.toFixed(2)}%</td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className={s.protection ? "border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300" : "border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-300"}>
                                {s.protection ? "Protected" : "Unprotected"}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => { window.scrollTo({ top: 0, behavior: "instant" }); navigate(`/endpoint-analytics/${s.endpoint.id}`); }} className="rounded-lg">
                                  <BarChart3 className="h-4 w-4 mr-1" /> Analytics
                                </Button>
                                <Button variant="ghost" size="sm" className="rounded-lg">
                                  <Settings className="h-4 w-4 mr-1" /> Configure
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "shadow" && (
            <motion.div key="shadow" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">

              {/* Warning banner */}
              <div className="flex items-start gap-3 px-5 py-4 rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50/80 dark:bg-amber-500/5">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Undocumented endpoints detected</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">These endpoints were discovered passively by the WAF — they received real traffic but were not in any uploaded Postman or OpenAPI collection. Review each one and decide to document, protect, or block it.</p>
                </div>
              </div>

              {/* Search */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl p-5">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search shadow endpoints..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50" />
                  </div>
                  <button onClick={fetchShadowEndpoints} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm text-slate-600 dark:text-slate-400 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${shadowLoading ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>
              </div>

              {/* Shadow endpoints table */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
                <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-amber-500" />
                      Shadow Endpoints
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-100 px-2 text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">{filteredShadow.length}</span>
                    </h3>
                    <p className="text-sm text-slate-500">Auto-discovered by WAF passive traffic analysis</p>
                  </div>
                </div>

                {shadowLoading ? (
                  <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" /></div>
                ) : filteredShadow.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10">
                      <CheckCircle className="h-8 w-8 text-emerald-500" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No shadow endpoints detected</p>
                    <p className="mt-1 text-sm text-slate-500">All traffic matches documented endpoints. Good coverage!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50/95 dark:bg-slate-900/95 border-b border-slate-200/60 dark:border-slate-800/60">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[300px]">Endpoint</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Discovered</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300">Status</th>
                          <th className="px-4 py-3 text-left font-semibold text-slate-600 dark:text-slate-300 min-w-[240px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredShadow.map((ep: any) => (
                          <tr key={ep.id} className="border-b border-slate-200/40 dark:border-slate-800/40 hover:bg-amber-50/30 dark:hover:bg-amber-500/5 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2 mb-1">
                                <EyeOff className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                                <Badge className={getMethodColor(ep.method)}>{ep.method}</Badge>
                                <span className="font-mono text-sm font-medium text-slate-900 dark:text-white truncate max-w-[220px]" title={ep.path}>{ep.path}</span>
                              </div>
                              <p className="text-xs text-slate-500 pl-6">{ep.name || "Auto-discovered endpoint"}</p>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs text-slate-500">{ep.created_at ? new Date(ep.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="h-2.5 w-2.5" /> Undocumented
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="rounded-lg border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-xs gap-1">
                                  <FileText className="h-3.5 w-3.5" /> Document
                                </Button>
                                <Button size="sm" variant="outline" className="rounded-lg border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs gap-1"
                                  onClick={() => handleBlockEndpoint(ep)}>
                                  <Ban className="h-3.5 w-3.5" /> Block
                                </Button>
                                <Button size="sm" variant="ghost" className="rounded-lg text-xs gap-1"
                                  onClick={() => { window.scrollTo({ top: 0, behavior: "instant" }); navigate(`/endpoint-analytics/${ep.id}`); }}>
                                  <BarChart3 className="h-3.5 w-3.5" /> Analytics
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default APIEndpoints;