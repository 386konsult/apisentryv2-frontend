import { useState, useEffect, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Search,
  Filter,
  Download,
  Shield,
  Ban,
  Globe,
  Eye,
  MoreVertical,
  MapPin,
  Bot,
  Activity,
  AlertTriangle,
  Clock,
  Code,
  TrendingUp,
  Flag,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import countriesData from "@/data/countries.json";
import { cn } from "@/lib/utils";

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

const AnimatedNumber = ({
  value,
  decimals = 0,
  suffix = '',
  className = '',
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const duration = 800;
    const start = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(target * eased);

      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <span className={className}>
      {displayValue.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};

interface RequestLog {
  id: string;
  endpoint_name: string;
  platform_name: string;
  timestamp: string;
  method: string;
  path: string;
  query_params: Record<string, any>;
  headers: Record<string, any>;
  request_body: any;
  status_code: number;
  response_headers: Record<string, any>;
  response_body: any;
  response_time_ms: number;
  client_ip: string;
  user_agent: string;
  waf_blocked: boolean;
  waf_rule_triggered: string | null;
  threat_level: string;
  platform: string;
  endpoint: string;
}

const SecurityHub = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<RequestLog | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [blockIPDialog, setBlockIPDialog] = useState<{ open: boolean; ip: string }>({ open: false, ip: "" });
  const [blockEndpointDialog, setBlockEndpointDialog] = useState<{ open: boolean; endpoint: string; endpointId: string }>({ open: false, endpoint: "", endpointId: "" });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [ipFilter, setIpFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState<string | null>(null);
  const [countryFilterOpen, setCountryFilterOpen] = useState(false);
  const [endpointFilter, setEndpointFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusCodeFilter, setStatusCodeFilter] = useState("all");
  const [threatLevelFilter, setThreatLevelFilter] = useState("all");
  const [wafBlockedFilter, setWafBlockedFilter] = useState("all");
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const [platformName, setPlatformName] = useState<string>("");

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

    fetchLogs(platformId);
  }, [navigate]);

  const fetchLogs = async (platformId: string) => {
    setLoading(true);
    try {
      // Fetch last 100 logs
      const response = await apiService.getPlatformRequestLogs(platformId, { num: '100' });
      if (Array.isArray(response)) {
        setAllLogs(response); // Set logs directly if response is an array
      } else if (response && Array.isArray((response as any).logs)) {
        setAllLogs((response as any).logs); // Extract logs if nested in `logs`
      } else {
        console.error('Unexpected response format for security hub logs:', response);
        setAllLogs([]); // Fallback to an empty array
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error loading logs",
        description: "Failed to fetch request logs",
        variant: "destructive",
      });
      setAllLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Extract unique values for filters
  const uniqueIPs = useMemo(() => {
    return Array.from(new Set(allLogs.map((log) => log.client_ip))).sort();
  }, [allLogs]);

  const uniqueEndpoints = useMemo(() => {
    return Array.from(
      new Set(allLogs.map((log) => `${log.method} ${log.path}`))
    ).sort();
  }, [allLogs]);

  const uniqueMethods = useMemo(() => {
    return Array.from(new Set(allLogs.map((log) => log.method))).sort();
  }, [allLogs]);

  const uniqueStatusCodes = useMemo(() => {
    return Array.from(new Set(allLogs.map((log) => log.status_code))).sort(
      (a, b) => a - b
    );
  }, [allLogs]);

  const uniqueThreatLevels = useMemo(() => {
    return Array.from(
      new Set(allLogs.map((log) => log.threat_level).filter(Boolean))
    ).sort();
  }, [allLogs]);

  // Update query parameters in the URL
  const updateQueryParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      if (key === "num" && value === "100") {
        params.delete("num"); // Remove `num=100` if it's the default
      } else {
        params.set(key, value);
      }
    } else {
      params.delete(key);
    }
    setSearchParams(params);

    // Log the updated query parameters
    console.log("Updated query parameters:", params.toString());
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    if (key === "blocked") {
      updateQueryParam(key, value); // Allow `blocked` to coexist with other filters
    } else {
      const params = new URLSearchParams(searchParams);
      params.delete("method");
      params.delete("status_code");
      params.delete("threat_level");
      params.delete("ip");
      params.delete("country");
      params.delete("endpoint");
      if (key !== "num" || value !== "100") {
        params.set(key, value); // Only set `num` if it's not the default
      }
      setSearchParams(params);
    }
  };

  // Clear a specific filter
  const clearFilter = (key: string) => {
    updateQueryParam(key, null);
  };

  // Clear all filters
  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("num"); // Ensure `num=100` is removed when clearing filters
    setSearchParams(params);
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...allLogs];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (log) =>
          log.client_ip?.toLowerCase().includes(searchLower) ||
          log.path?.toLowerCase().includes(searchLower) ||
          log.endpoint_name?.toLowerCase().includes(searchLower) ||
          log.user_agent?.toLowerCase().includes(searchLower) ||
          log.method?.toLowerCase().includes(searchLower)
      );
    }

    // IP filter - allow partial matching for text input
    if (ipFilter) {
      filtered = filtered.filter((log) => 
        log.client_ip?.toLowerCase().includes(ipFilter.toLowerCase())
      );
    }

    // Country filter - check if log has country data
    if (countryFilter) {
      filtered = filtered.filter((log) => {
        // Check if log has country field (if backend provides it)
        const logCountry = (log as any).country || (log as any).country_code;
        if (logCountry) {
          const selectedCountry = countriesData.find(c => c.name === countryFilter || c.code === countryFilter);
          if (selectedCountry) {
            return logCountry === selectedCountry.code || 
                   logCountry === selectedCountry.name ||
                   (typeof logCountry === 'string' && logCountry.toLowerCase() === selectedCountry.name.toLowerCase());
          }
        }
        // If no country data in log, we can't filter by country
        // Return true to show all logs (or false to hide all if strict filtering is desired)
        return true;
      });
    }

    // Endpoint filter
    if (endpointFilter !== "all") {
      filtered = filtered.filter(
        (log) => `${log.method} ${log.path}` === endpointFilter
      );
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((log) => log.method === methodFilter);
    }

    // Status code filter
    if (statusCodeFilter !== "all") {
      filtered = filtered.filter(
        (log) => log.status_code === parseInt(statusCodeFilter)
      );
    }

    // Threat level filter
    if (threatLevelFilter !== "all") {
      filtered = filtered.filter((log) => log.threat_level === threatLevelFilter);
    }

    // WAF blocked filter
    if (wafBlockedFilter !== "all") {
      const blocked = wafBlockedFilter === "blocked";
      filtered = filtered.filter((log) => log.waf_blocked === blocked);
    }

    setFilteredLogs(filtered);
  }, [
    allLogs,
    searchTerm,
    ipFilter,
    countryFilter,
    endpointFilter,
    methodFilter,
    statusCodeFilter,
    threatLevelFilter,
    wafBlockedFilter,
    searchParams,
  ]);

  // Analytics
  const analytics = useMemo(() => {
    const totalLogs = filteredLogs.length;
    const blockedLogs = filteredLogs.filter((log) => log.waf_blocked).length;
    const uniqueIPs = new Set(filteredLogs.map((log) => log.client_ip)).size;
    const errorLogs = filteredLogs.filter(
      (log) => log.status_code >= 400
    ).length;
    const avgResponseTime =
      filteredLogs.length > 0
        ? filteredLogs.reduce((sum, log) => sum + log.response_time_ms, 0) /
          filteredLogs.length
        : 0;

    // Bot detection (simple heuristic based on user agent)
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i,
    ];
    const botRequests = filteredLogs.filter((log) =>
      botPatterns.some((pattern) => pattern.test(log.user_agent || ""))
    ).length;

    // IP frequency for suspicious activity detection
    const ipFrequency: Record<string, number> = {};
    filteredLogs.forEach((log) => {
      ipFrequency[log.client_ip] = (ipFrequency[log.client_ip] || 0) + 1;
    });
    const suspiciousIPs = Object.entries(ipFrequency)
      .filter(([_, count]) => count > 10)
      .length;

    // Unique countries
    const uniqueCountries = new Set(
      filteredLogs
        .map((log) => (log as any).country || (log as any).country_code)
        .filter((country) => country && country !== "unknown")
    ).size;

    return {
      totalLogs,
      blockedLogs,
      uniqueIPs,
      errorLogs,
      avgResponseTime,
      botRequests,
      suspiciousIPs,
      uniqueCountries,
    };
  }, [filteredLogs]);

  const handleBlockIP = async (ip: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");
      
      await apiService.addToBlacklist({ platform_uuid: platformId, ip });
      toast({
        title: "IP Blocked",
        description: `${ip} has been added to the blacklist.`,
        variant: "default",
      });
      setBlockIPDialog({ open: false, ip: "" });
    } catch (error) {
      toast({
        title: "Error blocking IP",
        description: "Failed to block IP address.",
        variant: "destructive",
      });
    }
  };

  const handleBlockEndpoint = async (endpointString: string) => {
    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");

      // Parse method and path from endpoint string (format: "METHOD /path")
      const [method, ...pathParts] = endpointString.split(" ");
      const path = pathParts.join(" ");

      // Get endpoint details first
      const res = await apiService.getPlatformEndpoints(platformId);
      const endpointsArr = Array.isArray(res) ? res : res.results || [];
      
      // Find endpoint by matching method and path
      const endpoint = endpointsArr.find(
        (ep: any) => ep.method === method && ep.path === path
      );

      if (endpoint && endpoint.id) {
        await apiService.updateEndpoint(endpoint.id, {
          is_protected: true,
        });
        toast({
          title: "Endpoint Protected",
          description: `${endpointString} has been blocked from public access.`,
          variant: "default",
        });
      } else {
        throw new Error("Endpoint not found");
      }
      setBlockEndpointDialog({ open: false, endpoint: "", endpointId: "" });
    } catch (error: any) {
      toast({
        title: "Error blocking endpoint",
        description: error.message || "Failed to block endpoint.",
        variant: "destructive",
      });
    }
  };

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      PATCH: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    };
    return colors[method] || "bg-gray-100 text-gray-800";
  };

  const getStatusCodeColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
    } else if (statusCode >= 300 && statusCode < 400) {
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    } else if (statusCode >= 400 && statusCode < 500) {
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    } else {
      return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
    }
  };

  const getThreatLevelColor = (threatLevel: string) => {
    const colors: Record<string, string> = {
      high: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
      low: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      none: "bg-gray-100 text-gray-800",
    };
    return colors[threatLevel] || "bg-gray-100 text-gray-800";
  };

  const isBot = (userAgent: string) => {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /postman/i,
    ];
    return botPatterns.some((pattern) => pattern.test(userAgent || ""));
  };

  const exportLogs = () => {
    const csv = [
      ["Timestamp", "Method", "Path", "Status Code", "IP", "User Agent", "WAF Blocked", "Threat Level"],
      ...filteredLogs.map((log) => [
        log.timestamp,
        log.method,
        log.path,
        log.status_code.toString(),
        log.client_ip,
        log.user_agent,
        log.waf_blocked ? "Yes" : "No",
        log.threat_level || "none",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-hub-logs-${new Date().toISOString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const method = searchParams.get("method") || "all";
    const statusCode = searchParams.get("status_code") || "all";
    const threatLevel = searchParams.get("threat_level") || "all";
    const blocked = searchParams.get("blocked") || "all";
    const num = searchParams.get("num") || "100";

    setMethodFilter(method);
    setStatusCodeFilter(statusCode);
    setThreatLevelFilter(threatLevel);
    setWafBlockedFilter(blocked);
    // ...other filters...
  }, [searchParams]);

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
  
  {/* Background glow */}
  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />

  <div className="relative z-10 flex flex-col justify-between h-full gap-4">
    
    {/* Top — badges */}
    <div className="flex flex-wrap items-center gap-2">
      <span className="px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white text-xs font-medium">
        Security Hub
      </span>

      {platformName && (
        <span className="px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white text-xs font-medium">
          {platformName}
        </span>
      )}
    </div>

    {/* Bottom — content + actions */}
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
      
      {/* Left */}
      <div className="min-w-0">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words">
          Security Hub
        </h1>
        <p className="mt-1 text-sm text-blue-100 max-w-xl break-words">
          Comprehensive request log analysis and security investigation
        </p>
      </div>

      {/* Right */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-row gap-2 shrink-0"
      >
        <Button 
          variant="outline" 
          size="sm" 
          onClick={exportLogs}
          className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </motion.div>

    </div>
  </div>
</div>

      {/* Key Stats - 3 Primary Tiles */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid gap-6 grid-cols-1 md:grid-cols-3 w-full min-w-0"
      >
        {/* Total Requests */}
        <div className="group relative rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 p-6 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-blue-600 to-transparent"></div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Requests</p>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.totalLogs} /></p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Filtered results</p>
        </div>

        {/* Blocked Requests with gradient bar */}
        <div className="group relative rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 p-6 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10">
              <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-red-600 to-transparent"></div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Blocked Requests</p>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.blockedLogs} /></p>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Block Rate</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {analytics.totalLogs > 0 ? ((analytics.blockedLogs / analytics.totalLogs) * 100).toFixed(1) : 0}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500"
                style={{
                  width: `${analytics.totalLogs > 0 ? (analytics.blockedLogs / analytics.totalLogs) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Unique IPs */}
        <div className="group relative rounded-2xl border border-slate-200/50 bg-gradient-to-br from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-800/50 p-6 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-500/10">
              <MapPin className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className="h-1 w-8 rounded-full bg-gradient-to-r from-green-600 to-transparent"></div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Unique IPs</p>
          <p className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.uniqueIPs} /></p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Source addresses</p>
        </div>
      </motion.div>

      {/* Secondary Stats Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 w-full min-w-0"
      >
        {/* Errors */}
        <div className="group relative rounded-xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 p-4 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Errors</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.errorLogs} /></p>
          <p className="text-xs text-slate-500 dark:text-slate-400">4xx/5xx</p>
        </div>

        {/* Avg Response Time */}
        <div className="group relative rounded-xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 p-4 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Avg Response</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={Math.round(analytics.avgResponseTime)} />ms</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Response time</p>
        </div>

        {/* Bot Requests */}
        <div className="group relative rounded-xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 p-4 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <Bot className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Bot Requests</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.botRequests} /></p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {analytics.totalLogs > 0 ? ((analytics.botRequests / analytics.totalLogs) * 100).toFixed(1) : 0}%
          </p>
        </div>

        {/* Suspicious IPs */}
        <div className="group relative rounded-xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 p-4 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <TrendingUp className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Suspicious IPs</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.suspiciousIPs} /></p>
          <p className="text-xs text-slate-500 dark:text-slate-400">&gt;10 req/IP</p>
        </div>

        {/* Unique Countries */}
        <div className="group relative rounded-xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 p-4 transition-all duration-300 hover:shadow-lg overflow-hidden">
          <div className="relative z-10 flex items-center justify-between mb-2">
            <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Unique Countries</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white"><AnimatedNumber value={analytics.uniqueCountries} /></p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Source countries</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-md p-6 space-y-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">Refine your request log analysis</p>
          </div>
          {Array.from(searchParams.keys()).length > 0 && (
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search logs by IP, path, endpoint, user agent..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                updateQueryParam("search", e.target.value);
              }}
              className="pl-10 rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={methodFilter} onValueChange={(value) => handleFilterChange("method", value)}>
              <SelectTrigger className="rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="HTTP Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusCodeFilter} onValueChange={(value) => handleFilterChange("status_code", value)}>
              <SelectTrigger className="rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Status Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status Codes</SelectItem>
                <SelectItem value="200">200 OK</SelectItem>
                <SelectItem value="201">201 Created</SelectItem>
                <SelectItem value="400">400 Bad Request</SelectItem>
                <SelectItem value="401">401 Unauthorized</SelectItem>
                <SelectItem value="403">403 Forbidden</SelectItem>
                <SelectItem value="404">404 Not Found</SelectItem>
                <SelectItem value="500">500 Server Error</SelectItem>
              </SelectContent>
            </Select>

            <Select value={threatLevelFilter} onValueChange={(value) => handleFilterChange("threat_level", value)}>
              <SelectTrigger className="rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Threat Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Threat Levels</SelectItem>
                <SelectItem value="high">🔴 High</SelectItem>
                <SelectItem value="medium">🟡 Medium</SelectItem>
                <SelectItem value="low">🟢 Low</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>

            <Select value={wafBlockedFilter} onValueChange={(value) => handleFilterChange("blocked", value)}>
              <SelectTrigger className="rounded-lg border-slate-200/50 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="WAF Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="blocked">🚫 Blocked</SelectItem>
                <SelectItem value="allowed">✅ Allowed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters Display */}
          {Array.from(searchParams.keys()).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700"
            >
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active:</span>
              {searchParams.get("search") && (
                <div>
                  <Badge
                    onClick={() => clearFilter("search")}
                    className="cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 border border-blue-200 dark:border-blue-500/30"
                  >
                    ✕ Search: {searchParams.get("search")}
                  </Badge>
                </div>
              )}
              {searchParams.get("method") && (
                <div>
                  <Badge
                    onClick={() => clearFilter("method")}
                    className="cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 border border-blue-200 dark:border-blue-500/30"
                  >
                    ✕ Method: {searchParams.get("method")}
                  </Badge>
                </div>
              )}
              {searchParams.get("status_code") && (
                <div>
                  <Badge
                    onClick={() => clearFilter("status_code")}
                    className="cursor-pointer bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-blue-500/30 border border-blue-200 dark:border-blue-500/30"
                  >
                    ✕ Status: {searchParams.get("status_code")}
                  </Badge>
                </div>
              )}
              {searchParams.get("threat_level") && (
                <div>
                  <Badge
                    onClick={() => clearFilter("threat_level")}
                    className="cursor-pointer bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-300 dark:hover:bg-red-500/30 border border-red-200 dark:border-red-500/30"
                  >
                    ✕ Threat: {searchParams.get("threat_level")}
                  </Badge>
                </div>
              )}
              {searchParams.get("blocked") && (
                <div>
                  <Badge
                    onClick={() => clearFilter("blocked")}
                    className="cursor-pointer bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-500/20 dark:text-orange-300 dark:hover:bg-orange-500/30 border border-orange-200 dark:border-orange-500/30"
                  >
                    ✕ WAF: {searchParams.get("blocked")}
                  </Badge>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Request Logs - Responsive View */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-md overflow-hidden"
      >
        <div className="border-b border-slate-200/50 dark:border-slate-800/50 px-6 py-4 bg-gradient-to-r from-slate-50 dark:from-slate-800/30 to-transparent">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Latest Request Logs</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {filteredLogs.length > 0 ? `Showing ${filteredLogs.length} requests` : "No logs to display"}
          </p>
        </div>

        <div className="p-6">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium">Loading request logs...</p>
            </motion.div>
          ) : filteredLogs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="relative mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-xl" />
                <div className="relative bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 p-6 rounded-full shadow-lg">
                  <Shield className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No logs match your filters</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Try adjusting your filters or check back later for new security events.
              </p>
            </motion.div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block w-full overflow-hidden">
                <div className="max-h-[70vh] overflow-y-auto border border-slate-200/50 dark:border-slate-700/50 rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200/50 dark:border-slate-700/50 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">Timestamp</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">Method</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">Path</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white">IP</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">Response</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">WAF</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-white whitespace-nowrap">Threat</th>
                        <th className="px-4 py-3 text-center font-semibold text-slate-900 dark:text-white whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
                      {filteredLogs.map((log, index) => (
                        <tr
                          key={log.id}
                          className="hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-colors group"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-400">{log.timestamp}</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className={`${getMethodColor(log.method)} rounded-lg font-semibold`}>
                              {log.method}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate" title={log.path}>
                              {log.path}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <Badge className={`${getStatusCodeColor(log.status_code)} rounded-lg font-semibold`}>
                              {log.status_code}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{log.client_ip}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">{log.response_time_ms.toFixed(0)}ms</td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.waf_blocked ? (
                              <Badge className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 rounded-lg font-semibold">🚫 Blocked</Badge>
                            ) : (
                              <Badge className="bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300 rounded-lg font-semibold">✓ Allowed</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {log.threat_level && log.threat_level !== "none" ? (
                              <Badge className={`${getThreatLevelColor(log.threat_level)} rounded-lg font-semibold`}>
                                {log.threat_level.charAt(0).toUpperCase() + log.threat_level.slice(1)}
                              </Badge>
                            ) : (
                              <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 rounded-lg font-semibold">-</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedLog(log);
                                    setIsDetailsOpen(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setBlockIPDialog({ open: true, ip: log.client_ip })}
                                  className="cursor-pointer text-red-600 dark:text-red-400"
                                >
                                  <Ban className="h-4 w-4 mr-2" /> Block IP
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    setBlockEndpointDialog({
                                      open: true,
                                      endpoint: `${log.method} ${log.path}`,
                                      endpointId: log.endpoint,
                                    })
                                  }
                                  className="cursor-pointer text-orange-600 dark:text-orange-400"
                                >
                                  <Shield className="h-4 w-4 mr-2" /> Protect Endpoint
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile/Tablet Card View */}
              <div className="lg:hidden space-y-3 max-h-[70vh] overflow-y-auto">
                {filteredLogs.map((log, index) => (
                  <div
                    key={log.id}
                    className="group border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 hover:border-blue-400/50 dark:hover:border-blue-500/30 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Badge className={`${getMethodColor(log.method)} rounded-lg font-semibold flex-shrink-0`}>
                          {log.method}
                        </Badge>
                        <div className="min-w-0">
                          <p className="font-mono text-sm truncate text-slate-700 dark:text-slate-300">{log.path}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{log.timestamp}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-slate-200/50 dark:border-slate-700/50">
                      <Badge className={`${getStatusCodeColor(log.status_code)} rounded-lg font-semibold`}>
                        {log.status_code}
                      </Badge>
                      {log.waf_blocked ? (
                        <Badge className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 rounded-lg text-xs font-semibold">🚫 Blocked</Badge>
                      ) : (
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300 rounded-lg text-xs font-semibold">✓ Allowed</Badge>
                      )}
                      {log.threat_level && log.threat_level !== "none" && (
                        <Badge className={`${getThreatLevelColor(log.threat_level)} rounded-lg text-xs font-semibold`}>
                          {log.threat_level.charAt(0).toUpperCase() + log.threat_level.slice(1)}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">IP Address</Label>
                        <p className="text-sm font-mono text-slate-700 dark:text-slate-300">{log.client_ip}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-slate-500 dark:text-slate-400 font-medium">Response</Label>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{log.response_time_ms.toFixed(0)}ms</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {isBot(log.user_agent || "") && (
                        <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 rounded-lg text-xs font-semibold">
                          <Bot className="h-3 w-3 mr-1" /> Bot
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedLog(log);
                              setIsDetailsOpen(true);
                            }}
                            className="cursor-pointer"
                          >
                            <Eye className="h-4 w-4 mr-2" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setBlockIPDialog({ open: true, ip: log.client_ip })}
                            className="cursor-pointer text-red-600 dark:text-red-400"
                          >
                            <Ban className="h-4 w-4 mr-2" /> Block IP
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              setBlockEndpointDialog({
                                open: true,
                                endpoint: `${log.method} ${log.path}`,
                                endpointId: log.endpoint,
                              })
                            }
                            className="cursor-pointer text-orange-600 dark:text-orange-400"
                          >
                            <Shield className="h-4 w-4 mr-2" /> Protect Endpoint
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </motion.div>

      {/* Log Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full flex flex-col rounded-2xl">
          <DialogHeader className="flex-shrink-0 border-b border-slate-200 dark:border-slate-700 pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <DialogTitle className="text-2xl text-slate-900 dark:text-white">
                  {selectedLog?.method} {selectedLog?.path}
                </DialogTitle>
                <DialogDescription className="text-slate-600 dark:text-slate-400 mt-1">
                  Complete request and response details
                </DialogDescription>
              </div>
              {selectedLog?.waf_blocked && (
                <Badge className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 rounded-lg font-semibold flex-shrink-0">
                  🚫 Blocked by WAF
                </Badge>
              )}
            </div>
          </DialogHeader>
          {selectedLog && (
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] pr-2 flex-1 min-h-0 space-y-6">
              {/* Key Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Timestamp</Label>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">{selectedLog.timestamp}</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Status Code</Label>
                  <Badge className={`${getStatusCodeColor(selectedLog.status_code)} rounded-lg font-semibold w-fit`}>
                    {selectedLog.status_code}
                  </Badge>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Response Time</Label>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{selectedLog.response_time_ms.toFixed(2)}ms</p>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Method</Label>
                  <Badge className={`${getMethodColor(selectedLog.method)} rounded-lg font-semibold w-fit`}>
                    {selectedLog.method}
                  </Badge>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">Threat Level</Label>
                  <Badge className={`${getThreatLevelColor(selectedLog.threat_level)} rounded-lg font-semibold w-fit`}>
                    {selectedLog.threat_level ? selectedLog.threat_level.charAt(0).toUpperCase() + selectedLog.threat_level.slice(1) : "None"}
                  </Badge>
                </div>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50">
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">WAF Status</Label>
                  <Badge className={selectedLog.waf_blocked ? "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 rounded-lg font-semibold" : "bg-green-50 text-green-700 dark:bg-green-500/20 dark:text-green-300 rounded-lg font-semibold"}>
                    {selectedLog.waf_blocked ? "🚫 Blocked" : "✓ Allowed"}
                  </Badge>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white">Client Information</h4>
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">IP Address</Label>
                    <p className="text-sm font-mono text-slate-900 dark:text-white mt-1">{selectedLog.client_ip}</p>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400">User Agent</Label>
                    <div className="mt-1 flex items-start gap-2">
                      {isBot(selectedLog.user_agent || "") && (
                        <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 rounded-lg text-xs font-semibold flex-shrink-0 mt-1">
                          <Bot className="h-3 w-3 mr-1" /> Bot
                        </Badge>
                      )}
                      <p className="text-sm text-slate-700 dark:text-slate-300 break-all">{selectedLog.user_agent || "Unknown"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 dark:text-white">Request Details</h4>
                <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 border border-slate-700/50 font-mono text-xs text-slate-100 overflow-x-auto">
                  <p className="text-slate-400 mb-2">{selectedLog.method} {selectedLog.path}</p>
                  {selectedLog.query_params && Object.keys(selectedLog.query_params).length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-700">
                      <p className="text-slate-300 mb-2">Query Parameters:</p>
                      <pre className="whitespace-pre-wrap break-words text-slate-100">{JSON.stringify(selectedLog.query_params, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Headers */}
              {selectedLog.headers && Object.keys(selectedLog.headers).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Request Headers</h4>
                  <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 border border-slate-700/50 font-mono text-xs text-slate-100 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedLog.headers, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Request Body */}
              {selectedLog.request_body && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Request Body</h4>
                  <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 border border-slate-700/50 font-mono text-xs text-slate-100 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">
                      {typeof selectedLog.request_body === "object"
                        ? JSON.stringify(selectedLog.request_body, null, 2)
                        : selectedLog.request_body}
                    </pre>
                  </div>
                </div>
              )}

              {/* Response Headers */}
              {selectedLog.response_headers && Object.keys(selectedLog.response_headers).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Response Headers</h4>
                  <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 border border-slate-700/50 font-mono text-xs text-slate-100 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">{JSON.stringify(selectedLog.response_headers, null, 2)}</pre>
                  </div>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.response_body && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">Response Body</h4>
                  <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 border border-slate-700/50 font-mono text-xs text-slate-100 overflow-x-auto">
                    <pre className="whitespace-pre-wrap break-words">
                      {typeof selectedLog.response_body === "object"
                        ? JSON.stringify(selectedLog.response_body, null, 2)
                        : selectedLog.response_body}
                    </pre>
                  </div>
                </div>
              )}

              {/* WAF Rule */}
              {selectedLog.waf_rule_triggered && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-slate-900 dark:text-white">WAF Rule Triggered</h4>
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-4 border border-red-200 dark:border-red-500/20">
                    <p className="text-sm font-semibold text-red-700 dark:text-red-300">{selectedLog.waf_rule_triggered}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block IP Dialog */}
      <AlertDialog open={blockIPDialog.open} onOpenChange={(open) => setBlockIPDialog({ open, ip: blockIPDialog.ip })}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10">
                <Ban className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Block IP Address</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{blockIPDialog.ip}</span> will be permanently added to your IP blacklist. All requests from this address will be blocked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBlockIP(blockIPDialog.ip)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Block IP Address
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block Endpoint Dialog */}
      <AlertDialog
        open={blockEndpointDialog.open}
        onOpenChange={(open) =>
          setBlockEndpointDialog({
            open,
            endpoint: blockEndpointDialog.endpoint,
            endpointId: blockEndpointDialog.endpointId,
          })
        }
      >
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/10">
                <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <AlertDialogTitle className="text-xl">Protect Endpoint</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              <span className="font-mono font-semibold text-slate-900 dark:text-white">{blockEndpointDialog.endpoint}</span> will have enhanced protection enabled. This endpoint will require additional authentication.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-lg">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleBlockEndpoint(blockEndpointDialog.endpoint)}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
            >
              Protect Endpoint
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SecurityHub;

