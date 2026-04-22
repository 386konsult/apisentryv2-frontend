import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
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
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  Search,
  Eye,
  Download,
  Shield,
  Clock,
  MapPin,
  Code,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const TIME_RANGES = [
  { label: "Last 7 Days", value: "7d" },
  { label: "Last 30 Days", value: "30d" },
  { label: "Last Year", value: "1y" },
  { label: "All Time", value: "all" },
];

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

const AnimatedNumber = ({
  value,
  decimals = 0,
  suffix = "",
  className = "",
}: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  useEffect(() => {
    const target = Number.isFinite(value) ? value : 0;
    const duration = 800;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
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

// ── Helper to parse various timestamp formats (same as original) ─────────────
const parseLogTimestamp = (log: any): number | null => {
  const raw = log?.timestamp ?? log?.created_at ?? log?.createdAt;
  if (raw == null) return null;
  if (typeof raw === "number") return raw < 1e12 ? raw * 1000 : raw;
  if (typeof raw === "string") {
    let s = raw.trim();
    s = s.replace(/\+00:00Z$/, "Z");
    // DD-MM-YYYY HH:MM format (e.g., "22-04-2026 16:21")
    const ddmmyyyyRegex = /^(\d{1,2})-(\d{1,2})-(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/;
    const m = s.match(ddmmyyyyRegex);
    if (m) {
      return Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), Number(m[4]), Number(m[5]), m[6] ? Number(m[6]) : 0);
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) s = s.replace(" ", "T");
    if (!/[zZ]|[+\-]\d{2}:\d{2}$/.test(s)) s = `${s}Z`;
    const ms = Date.parse(s);
    if (!isNaN(ms)) return ms;
  }
  return null;
};

const ThreatLogs = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [methodFilter, setMethodFilter] = useState("all");
  const [statusCodeFilter, setStatusCodeFilter] = useState("all");
  const [threatLevelFilter, setThreatLevelFilter] = useState("all");
  const [wafBlockedFilter, setWafBlockedFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [threatType, setThreatType] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("all");
  const [ipFilter, setIpFilter] = useState("all");
  const [endpointFilter, setEndpointFilter] = useState("");
  const [allLogs, setAllLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [platformName, setPlatformName] = useState<string>("");

  // ── fetch threat logs (blocked only) ────────────────────────────────────────
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

    const fetchThreats = async () => {
      setLoading(true);
      try {
        const platformId = localStorage.getItem("selected_platform_id");
        if (!platformId) {
          navigate("/platforms");
          return;
        }
        const response = await apiService.getPlatformThreatLogs(platformId, {
          blocked: true,
        });
        if (response && response.logs) {
          setAllLogs(response.logs);
        } else if (Array.isArray(response)) {
          setAllLogs(response);
        } else {
          console.error("Unexpected response format for threat logs:", response);
          setAllLogs([]);
        }
      } catch (error) {
        console.error("Error fetching threat logs:", error);
        setAllLogs([]);
        toast({
          title: "Error loading threat logs",
          description: "Failed to fetch threat logs",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchThreats();
  }, [toast, navigate]);

  const allBlockedThreats = allLogs;

  // ── extract filter options ──────────────────────────────────────────────────
  const uniqueThreatTypes = useMemo(() => {
    const types = new Set<string>();
    allBlockedThreats.forEach((log) => {
      if (log.waf_rule_triggered) {
        const ruleName = log.waf_rule_triggered.toLowerCase();
        if (ruleName.includes("sql")) types.add("SQL Injection");
        else if (ruleName.includes("xss")) types.add("XSS");
        else if (ruleName.includes("path") || ruleName.includes("traversal"))
          types.add("Path Traversal");
        else if (ruleName.includes("brute")) types.add("Brute Force");
        else if (ruleName.includes("malware")) types.add("Malware");
        else types.add(log.waf_rule_triggered);
      }
    });
    return Array.from(types).sort();
  }, [allBlockedThreats]);

  const uniqueIPs = useMemo(
    () => Array.from(new Set(allBlockedThreats.map((t) => t.client_ip))).sort(),
    [allBlockedThreats]
  );
  const uniqueSeverities = useMemo(
    () =>
      Array.from(
        new Set(allBlockedThreats.map((t) => t.threat_level).filter(Boolean))
      ).sort(),
    [allBlockedThreats]
  );

  // ── client‑side filtering ──────────────────────────────────────────────────
  const filteredThreats = useMemo(() => {
    let result = allBlockedThreats;

    // Time range filter (client side) – now uses parseLogTimestamp
    if (timeRange !== "all") {
      const now = new Date();
      let start: Date;
      switch (timeRange) {
        case "7d":
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "1y":
          start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          start = new Date(0);
      }
      result = result.filter((log) => {
        const ts = parseLogTimestamp(log);
        if (ts == null) return false;
        return ts >= start.getTime();
      });
    }

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(
        (log) =>
          log.client_ip?.toLowerCase().includes(lower) ||
          log.path?.toLowerCase().includes(lower) ||
          log.waf_rule_triggered?.toLowerCase().includes(lower) ||
          log.user_agent?.toLowerCase().includes(lower)
      );
    }

    // Severity
    if (severityFilter !== "all") {
      result = result.filter((log) => log.threat_level === severityFilter);
    }

    // IP
    if (ipFilter !== "all") {
      result = result.filter((log) => log.client_ip === ipFilter);
    }

    // Endpoint
    if (endpointFilter && endpointFilter.trim()) {
      const lower = endpointFilter.toLowerCase();
      result = result.filter(
        (log) =>
          log.path?.toLowerCase().includes(lower) ||
          `${log.method} ${log.path}`.toLowerCase().includes(lower)
      );
    }

    // Threat type
    if (threatType !== "all") {
      result = result.filter((log) => {
        const rule = (log.waf_rule_triggered || "").toLowerCase();
        if (threatType === "SQL Injection") return rule.includes("sql");
        if (threatType === "XSS") return rule.includes("xss");
        if (threatType === "Path Traversal")
          return rule.includes("path") || rule.includes("traversal");
        if (threatType === "Brute Force") return rule.includes("brute");
        if (threatType === "Malware") return rule.includes("malware");
        return log.waf_rule_triggered === threatType;
      });
    }

    return result;
  }, [
    allBlockedThreats,
    timeRange,
    searchTerm,
    severityFilter,
    ipFilter,
    endpointFilter,
    threatType,
  ]);

  const getSeverityConfig = (threat_level: string) => {
    switch (threat_level) {
      case "high":
        return {
          cls: "bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-400",
          dot: "bg-red-500",
        };
      case "medium":
        return {
          cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
          dot: "bg-amber-500",
        };
      case "low":
        return {
          cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
          dot: "bg-emerald-500",
        };
      default:
        return {
          cls: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
          dot: "bg-slate-400",
        };
    }
  };

  // Stats cards data
  const statsData = [
    {
      label: "Today's Threats",
      value: allBlockedThreats.length,
      icon: AlertTriangle,
      iconColor: "text-red-500",
      bg: "bg-red-50 dark:bg-red-500/10",
      sub: "Blocked requests",
    },
    {
      label: "High Severity",
      value: allBlockedThreats.filter((t) => t.threat_level === "high").length,
      icon: AlertTriangle,
      iconColor: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10",
      sub: "Requires attention",
      valueColor: "text-red-600 dark:text-red-400",
    },
    {
      label: "Medium Severity",
      value: allBlockedThreats.filter((t) => t.threat_level === "medium").length,
      icon: AlertTriangle,
      iconColor: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-500/10",
      sub: "Monitor closely",
      valueColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Unique IPs",
      value: new Set(allBlockedThreats.map((t) => t.client_ip)).size,
      icon: MapPin,
      iconColor: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10",
      sub: "Unique source IPs",
    },
  ];

  const clearAllFilters = () => {
    setSearchTerm("");
    setSeverityFilter("all");
    setThreatType("all");
    setIpFilter("all");
    setEndpointFilter("");
    setTimeRange("all");
  };

  // ── export logs (CSV) – bug fix ────────────────────────────────────────────
  const exportFilteredLogs = () => {
    const csv = [
      ["Timestamp", "Threat Type", "Severity", "Source IP", "Request", "Status Code", "User Agent"],
      ...filteredThreats.map((t) => [
        t.timestamp,
        t.waf_rule_triggered || "Unknown",
        t.threat_level || "low",
        t.client_ip,
        `${t.method} ${t.path}`,
        t.status_code || "N/A",
        t.user_agent || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threat-logs-${new Date().toISOString()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // JSX – redesigned to match PlatformDetails / Security Hub
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        {/* Header – red/orange gradient (threat theme) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-red-600 to-orange-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                  Threat Logs
                </span>
                {platformName && (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white">
                    {platformName}
                  </span>
                )}
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold leading-tight tracking-tight mb-3">
                Threat Logs
              </h1>
              <p className="text-sm text-red-100 max-w-xl">
                Security events and threat detection history
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={exportFilteredLogs}
                className="rounded-full border-white/50 bg-white/15 px-5 py-2 text-white font-medium hover:!bg-white/25 hover:!text-white"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Logs
              </Button>
              <Button
                size="sm"
                onClick={() => navigate("/create-alert")}
                className="rounded-full bg-white px-5 py-2 text-red-600 font-medium hover:bg-white/90"
              >
                <Shield className="mr-2 h-4 w-4" />
                Create Alert
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards (4 cards) */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 mt-4">
                  {stat.label}
                </p>
                <p
                  className={`text-3xl font-bold ${
                    stat.valueColor || "text-slate-900 dark:text-white"
                  }`}
                >
                  <AnimatedNumber value={stat.value} />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {stat.sub}
                </p>
                <div className="mt-4 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-700"
                    style={{
                      width: `${
                        stat.value > 0
                          ? Math.min(
                              100,
                              (stat.value /
                                Math.max(
                                  ...statsData.map((s) => s.value),
                                  1
                                )) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden p-6 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Filters
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Refine your threat log results
              </p>
            </div>
            {(searchTerm ||
              severityFilter !== "all" ||
              threatType !== "all" ||
              ipFilter !== "all" ||
              (endpointFilter && endpointFilter.trim()) ||
              timeRange !== "all") && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Search + Time range */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by IP, path, rule..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
              />
            </div>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-full sm:w-[180px] rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <Clock className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                {TIME_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                {uniqueSeverities.map((sev) => (
                  <SelectItem key={sev} value={sev}>
                    {sev.charAt(0).toUpperCase() + sev.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={threatType} onValueChange={setThreatType}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <SelectValue placeholder="Threat Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Threats</SelectItem>
                {uniqueThreatTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ipFilter} onValueChange={setIpFilter}>
              <SelectTrigger className="rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50">
                <MapPin className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="IP Address" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All IPs</SelectItem>
                {uniqueIPs.map((ip) => (
                  <SelectItem key={ip} value={ip}>
                    {ip}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Code className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Filter by endpoint..."
                value={endpointFilter}
                onChange={(e) => setEndpointFilter(e.target.value)}
                className="pl-9 rounded-lg border-slate-200/70 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50"
              />
            </div>
          </div>

          {/* Active filter badges */}
          {(searchTerm ||
            severityFilter !== "all" ||
            threatType !== "all" ||
            ipFilter !== "all" ||
            (endpointFilter && endpointFilter.trim()) ||
            timeRange !== "all") && (
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active:
              </span>
              {searchTerm && (
                <Badge
                  className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-full text-xs cursor-pointer"
                  onClick={() => setSearchTerm("")}
                >
                  ✕ Search: {searchTerm}
                </Badge>
              )}
              {timeRange !== "all" && (
                <Badge
                  className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs cursor-pointer"
                  onClick={() => setTimeRange("all")}
                >
                  ✕ Time:{" "}
                  {TIME_RANGES.find((r) => r.value === timeRange)?.label}
                </Badge>
              )}
              {severityFilter !== "all" && (
                <Badge
                  className="bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/30 rounded-full text-xs cursor-pointer"
                  onClick={() => setSeverityFilter("all")}
                >
                  ✕ Severity: {severityFilter}
                </Badge>
              )}
              {threatType !== "all" && (
                <Badge
                  className="bg-orange-50 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30 rounded-full text-xs cursor-pointer"
                  onClick={() => setThreatType("all")}
                >
                  ✕ Type: {threatType}
                </Badge>
              )}
              {ipFilter !== "all" && (
                <Badge
                  className="bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-full text-xs cursor-pointer"
                  onClick={() => setIpFilter("all")}
                >
                  ✕ IP: {ipFilter}
                </Badge>
              )}
              {endpointFilter && endpointFilter.trim() && (
                <Badge
                  className="bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 rounded-full text-xs cursor-pointer"
                  onClick={() => setEndpointFilter("")}
                >
                  ✕ Endpoint:{" "}
                  {endpointFilter.length > 20
                    ? endpointFilter.substring(0, 20) + "..."
                    : endpointFilter}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Threat Logs List Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <div className="border-b border-slate-200/70 dark:border-slate-800/70 px-6 py-4 bg-white dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Security Events
              <span className="ml-2 inline-flex items-center justify-center h-5 px-2 rounded-full bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 text-xs font-bold">
                {filteredThreats.length}
              </span>
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Detailed view of detected threats and security incidents
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              </div>
            ) : filteredThreats.length === 0 ? (
              <div className="text-center py-16">
                <Shield className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  No threat logs match your filters
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredThreats.map((threat) => {
                  const sevCfg = getSeverityConfig(threat.threat_level || "low");
                  return (
                    <div
                      key={threat.id}
                      className="group rounded-xl border border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900 p-5 hover:border-red-400/40 dark:hover:border-red-500/30 hover:shadow-md transition-all duration-200"
                    >
                      {/* Top row */}
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 flex-shrink-0 mt-0.5">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                              {threat.waf_rule_triggered || "Security Event"}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                              {threat.timestamp}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sevCfg.cls}`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${sevCfg.dot}`} />
                            {threat.threat_level || "low"}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 border border-red-200 dark:border-red-500/20">
                            🚫 Blocked
                          </span>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 px-3 py-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Source IP
                          </p>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                              {threat.client_ip}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 px-3 py-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Request
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Code className="h-3 w-3 text-slate-400 flex-shrink-0" />
                            <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                              {threat.method} {threat.path}
                            </span>
                          </div>
                        </div>
                        <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/70 px-3 py-2">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                            Status Code
                          </p>
                          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            {threat.status_code || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-200/70 dark:border-slate-800/70">
                        <span className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-xs font-mono">
                          {threat.user_agent
                            ? threat.user_agent.substring(0, 60) + "..."
                            : "Unknown User Agent"}
                        </span>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-xs opacity-60 group-hover:opacity-100 transition-opacity h-7"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>
                                Threat Details —{" "}
                                {threat.waf_rule_triggered || "Security Event"}
                              </DialogTitle>
                              <DialogDescription>
                                Complete information about this security event
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-5">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70">
                                  <Label className="text-xs text-slate-500">
                                    Timestamp
                                  </Label>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 font-mono">
                                    {threat.timestamp}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70">
                                  <Label className="text-xs text-slate-500">
                                    Status Code
                                  </Label>
                                  <p className="text-sm font-medium text-slate-900 dark:text-white mt-1 font-mono">
                                    {threat.status_code || "N/A"}
                                  </p>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70">
                                  <Label className="text-xs text-slate-500">
                                    Severity
                                  </Label>
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${sevCfg.cls}`}
                                  >
                                    {threat.threat_level || "low"}
                                  </span>
                                </div>
                                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-200/70 dark:border-slate-700/70">
                                  <Label className="text-xs text-slate-500">
                                    WAF Status
                                  </Label>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-500/20 dark:text-red-300 mt-1">
                                    🚫 Blocked
                                  </span>
                                </div>
                              </div>

                              <div>
                                <Label className="text-xs font-semibold text-slate-500">
                                  Source IP
                                </Label>
                                <p className="text-sm font-mono mt-1">
                                  {threat.client_ip}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-500">
                                  Request
                                </Label>
                                <p className="text-sm font-mono mt-1">
                                  {threat.method} {threat.path}
                                </p>
                              </div>
                              <div>
                                <Label className="text-xs font-semibold text-slate-500">
                                  WAF Rule Triggered
                                </Label>
                                <p className="text-sm mt-1">
                                  {threat.waf_rule_triggered || "None"}
                                </p>
                              </div>
                              {threat.user_agent && (
                                <div>
                                  <Label className="text-xs font-semibold text-slate-500">
                                    User Agent
                                  </Label>
                                  <p className="text-sm bg-slate-50 dark:bg-slate-800 p-3 rounded-xl mt-1 break-all font-mono text-xs">
                                    {threat.user_agent}
                                  </p>
                                </div>
                              )}
                              {threat.query_params &&
                                Object.keys(threat.query_params).length > 0 && (
                                  <div>
                                    <Label className="text-xs font-semibold text-slate-500">
                                      Query Parameters
                                    </Label>
                                    <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(
                                          threat.query_params,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              {threat.headers &&
                                Object.keys(threat.headers).length > 0 && (
                                  <div>
                                    <Label className="text-xs font-semibold text-slate-500">
                                      Request Headers
                                    </Label>
                                    <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(threat.headers, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              {threat.request_body && (
                                <div>
                                  <Label className="text-xs font-semibold text-slate-500">
                                    Request Body
                                  </Label>
                                  <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2">
                                    <pre className="whitespace-pre-wrap break-words">
                                      {typeof threat.request_body === "object"
                                        ? JSON.stringify(threat.request_body, null, 2)
                                        : threat.request_body}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              {threat.response_headers &&
                                Object.keys(threat.response_headers).length >
                                  0 && (
                                  <div>
                                    <Label className="text-xs font-semibold text-slate-500">
                                      Response Headers
                                    </Label>
                                    <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2">
                                      <pre className="whitespace-pre-wrap break-words">
                                        {JSON.stringify(
                                          threat.response_headers,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              {threat.response_body && (
                                <div>
                                  <Label className="text-xs font-semibold text-slate-500">
                                    Response Body
                                  </Label>
                                  <div className="rounded-xl bg-slate-900 dark:bg-slate-950 p-4 font-mono text-xs text-slate-100 overflow-x-auto mt-2">
                                    <pre className="whitespace-pre-wrap break-words">
                                      {typeof threat.response_body === "object"
                                        ? JSON.stringify(threat.response_body, null, 2)
                                        : threat.response_body}
                                    </pre>
                                  </div>
                                </div>
                              )}
                              {typeof threat.response_time_ms === "number" && (
                                <div>
                                  <Label className="text-xs font-semibold text-slate-500">
                                    Response Time
                                  </Label>
                                  <p className="text-sm mt-1">
                                    {threat.response_time_ms} ms
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreatLogs;