import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Link2, GitBranch, PlusCircle, ExternalLink,
  Settings, AlertTriangle, CheckCircle2, XCircle,
  Shield, Zap,
} from "lucide-react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/services/api";
import { usePlatform } from "@/contexts/PlatformContext";

/* ─── types ─────────────────────────────────────────────────────────── */
type Provider = "github" | "bitbucket";

interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  private: boolean;
  language: string | null;
  lastScan: string | null;
  risk: string;
  score: number | null;
  status: string;
  totalSuggestions: number;
  openSuggestions: number;
  resolvedSuggestions: number;
  owner?: { login: string; avatar_url: string };
}

interface ProviderProfile {
  account_login?: string;
  account_type?: string;
  avatar_url?: string;
  profile_url?: string;
  installation_id?: string | null;
  connected: boolean;
  platform_name?: string;
  repositories_count?: number;
  repository_selection?: string;
}

/* ─── animated counter ───────────────────────────────────────────────── */
function AnimatedCount({ to, duration = 1.2 }: { to: number; duration?: number }) {
  const count   = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(count, to, { duration, ease: "easeOut" });
    const unsub    = rounded.on("change", setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [to]);

  return <span>{display}</span>;
}

/* ─── language dot colours ───────────────────────────────────────────── */
const langColor: Record<string, string> = {
  TypeScript: "#3178C6", JavaScript: "#F7DF1E", Python: "#3572A5",
  Rust: "#DEA584", Go: "#00ADD8", Java: "#B07219", default: "#8B9CF4",
};

/* ════════════════════════════════════════════════════════════════════════ */
const CodeReviewConnect = () => {
  const { selectedPlatformId } = usePlatform();
  const [provider, setProvider] = useState<Provider>("github");
  const [repos,    setRepos]    = useState<Repo[]>([]);
  const [profile,  setProfile]  = useState<ProviderProfile | null>(null);
  const [loading,         setLoading]         = useState(false);
  const [profileLoading,  setProfileLoading]  = useState(false);
  const [error,           setError]           = useState("");
  const [successMessage,  setSuccessMessage]  = useState("");
  const [page,     setPage]    = useState(1);
  const [pageSize]             = useState(20);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  useEffect(() => {
    if (error)          { const t = setTimeout(() => setError(""),          5000); return () => clearTimeout(t); }
  }, [error]);
  useEffect(() => {
    if (successMessage) { const t = setTimeout(() => setSuccessMessage(""), 5000); return () => clearTimeout(t); }
  }, [successMessage]);

  const fetchProfile = () => {
    if (!selectedPlatformId) { setProfile(null); setProfileLoading(false); return; }
    setProfileLoading(true); setError("");
    const token = localStorage.getItem("auth_token");
    const pn    = provider === "github" ? "github" : "bitbucket";
    fetch(`${API_BASE_URL}/${pn}/status/?platform_id=${selectedPlatformId}`, {
      method: "GET", credentials: "include",
      headers: token ? { Authorization: `Token ${token}` } : {},
    })
      .then(r => {
        if (r.status === 400) throw new Error("Platform ID is required");
        if (r.status === 404) throw new Error("Platform not found");
        if (!r.ok)            throw new Error(`Failed to fetch profile: ${r.status}`);
        return r.json();
      })
      .then(d  => { setProfile(d); setProfileLoading(false); })
      .catch(e => { setError(e.message || "Failed to fetch profile"); setProfile(null); setProfileLoading(false); });
  };

  useEffect(() => {
    const urlParams      = new URLSearchParams(window.location.search);
    const installationId = urlParams.get("installation_id");
    const setupAction    = urlParams.get("setup_action");

    if (installationId && provider === "github") {
      setLoading(true); setError("");
      if (!selectedPlatformId) { setError("No platform selected. Please select a platform first."); setLoading(false); return; }
      const token = localStorage.getItem("auth_token");
      fetch(`${API_BASE_URL}/github/installation/`, {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Token ${token}` } : {}) },
        body: JSON.stringify({ installation_id: installationId, platform_id: selectedPlatformId, setup_action: setupAction }),
      })
        .then(r => {
          if (r.status === 409) { setSuccessMessage("GitHub App already installed. Fetching updated status..."); fetchProfile(); fetchRepos(page); setLoading(false); return null; }
          if (!r.ok) throw new Error(`GitHub App installation failed: ${r.status}`);
          return r.json();
        })
        .then(d => { if (d) { setSuccessMessage("GitHub App installed! Repositories connected."); fetchRepos(page); fetchProfile(); } setLoading(false); })
        .catch(e => { setError(e.message || "GitHub App installation failed."); setLoading(false); });
    } else if (selectedPlatformId) {
      fetchRepos(page); fetchProfile();
    }
    // eslint-disable-next-line
  }, [selectedPlatformId, page, provider]);

  const fetchRepos = (pageNum: number) => {
    if (!selectedPlatformId) { setError("No platform selected."); setLoading(false); return; }
    setLoading(true); setError("");
    const token = localStorage.getItem("auth_token");
    const pn    = provider === "github" ? "github" : "bitbucket";
    fetch(`${API_BASE_URL}/${pn}/repos/?page=${pageNum}&page_size=${pageSize}&platform_id=${selectedPlatformId}`, {
      method: "GET", credentials: "include",
      headers: token ? { Authorization: `Token ${token}` } : {},
    })
      .then(r => {
        if (r.status === 404) { setRepos([]); setLoading(false); return null; }
        if (!r.ok) throw new Error(`Failed to fetch repositories: ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d) {
          if (Array.isArray(d))                            setRepos(d);
          else if (d.results && Array.isArray(d.results)) setRepos(d.results);
          else                                             setRepos([]);
        } else setRepos([]);
        setLoading(false);
      })
      .catch(e => {
        if (e.message !== "Failed to fetch repositories: 404") setError(e.message || "Could not load repositories.");
        setLoading(false);
      });
  };

  const handleConnect = async () => {
    if (provider === "github") {
      window.location.href = "https://github.com/apps/Smartcomply Heimdall-ai/installations/select_target";
    } else {
      if (!selectedPlatformId) { setError("No platform selected"); return; }
      try {
        const token = localStorage.getItem("auth_token");
        const res   = await fetch(`${API_BASE_URL}/bitbucket/oauth/authorize/?platform_id=${selectedPlatformId}`, {
          method: "GET", credentials: "include",
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          const url  = typeof data === "string" ? data : (data.authorization_url || data.auth_url || data.url);
          if (url) window.location.href = url;
          else throw new Error("No authorization URL received");
        } else throw new Error(`Failed to initiate Bitbucket connection: ${res.status}`);
      } catch (e: any) { setError(e.message || "Error connecting to Bitbucket"); }
    }
  };

  const handleDisconnect = async () => {
    if (!selectedPlatformId) { setError("No platform selected"); return; }
    try {
      const token = localStorage.getItem("auth_token");
      const pn    = provider === "github" ? "github" : "bitbucket";
      const res   = await fetch(`${API_BASE_URL}/${pn}/disconnect/?platform_id=${selectedPlatformId}`, {
        method: "POST", credentials: "include",
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      if (res.ok) { setProfile(null); setRepos([]); setError(""); setSuccessMessage(`Successfully disconnected from ${providerDisplayName}`); }
      else throw new Error(`Failed to disconnect: ${res.status}`);
    } catch (e) { setError(`Error disconnecting ${providerDisplayName}`); }
  };

  useEffect(() => {
    if (selectedPlatformId) { fetchRepos(page); fetchProfile(); }
    // eslint-disable-next-line
  }, [provider]);

  /* ── no platform guard ───────────────────────────────────────────────── */
  if (!selectedPlatformId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="max-w-sm w-full rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-xl p-8 text-center space-y-4"
        >
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center">
            <Settings className="w-7 h-7 text-blue-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Workspace Required</h2>
          <p className="text-sm text-slate-400 dark:text-slate-500 leading-relaxed">Select a workspace to manage repository connections.</p>
        </motion.div>
      </div>
    );
  }

  const providerDisplayName = provider === "github" ? "GitHub" : "Bitbucket";

  const riskStyle: Record<string, string> = {
    Low:      "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
    Medium:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
    High:     "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
    Critical: "bg-red-500 text-white dark:bg-red-600",
  };

  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* ── Hero Banner ── */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Repository Connect
              </Badge>
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Code Review
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                  Repository Connect
                </h1>
                <p className="mt-1 text-sm text-blue-100 max-w-xl">
                  Connect your repositories for automated code review and security scanning.
                </p>
              </div>
              <div className="flex gap-2 shrink-0 flex-wrap">
                {/* Provider pill toggle */}
                <div className="flex rounded-full bg-white/10 border border-white/20 p-1 gap-1">
                  {(["github", "bitbucket"] as Provider[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setProvider(p)}
                      className={`relative px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                        provider === p ? "text-blue-700" : "text-white/80 hover:text-white"
                      }`}
                    >
                      {provider === p && (
                        <motion.div
                          layoutId="provider-pill"
                          className="absolute inset-0 rounded-full bg-white shadow-sm"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{p === "github" ? "GitHub" : "Bitbucket"}</span>
                    </button>
                  ))}
                </div>

                {/* Connect button */}
                <motion.button
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConnect}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-blue-700 text-xs font-semibold shadow-md hover:bg-white/90 transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  {profile?.connected
                    ? (provider === "github" ? "Update Installation" : "Reconnect")
                    : (provider === "github" ? "Install GitHub App"  : "Connect Bitbucket")}
                </motion.button>

                {/* Disconnect */}
                {profile?.connected && (
                  <Dialog open={showDisconnectConfirm} onOpenChange={setShowDisconnectConfirm}>
                    <DialogTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.03, y: -1 }}
                        whileTap={{ scale: 0.97 }}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/30 bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Disconnect
                      </motion.button>
                    </DialogTrigger>
                    <DialogContent className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-2xl">
                      <DialogHeader>
                        <DialogTitle className="text-slate-900 dark:text-white">Disconnect {providerDisplayName}?</DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400">
                          Are you sure you want to disconnect {providerDisplayName}?
                        </DialogDescription>
                      </DialogHeader>
                      <div className="rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/80 dark:bg-slate-800/50 p-4 text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
                        <p>• Remove access to all connected repositories</p>
                        <p>• Stop code review and security scanning</p>
                        <p>• Require a new connection to reconnect</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button variant="outline" className="rounded-xl border-slate-200/70 dark:border-slate-700" onClick={() => setShowDisconnectConfirm(false)}>
                          Cancel
                        </Button>
                        <Button
                          className="rounded-xl bg-red-500 hover:bg-red-600 text-white border-0"
                          onClick={() => { setShowDisconnectConfirm(false); handleDisconnect(); }}
                        >
                          Disconnect {providerDisplayName}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Toast messages ───────────────────────────────────────────────── */}
      {successMessage && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-green-200/50 dark:border-green-800/30 bg-green-50/60 dark:bg-green-900/10 text-green-700 dark:text-green-400 text-sm"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {successMessage}
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200/50 dark:border-red-800/30 bg-red-50/60 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-sm"
        >
          <XCircle className="w-4 h-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* ── Connection status card ───────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.14 }}>
        {profileLoading ? (
          <div className="rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900 shadow-sm p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-slate-200/60 dark:bg-slate-700/60 animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-40 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 animate-pulse" />
              <div className="h-3 w-28 rounded-lg bg-slate-100/60 dark:bg-slate-800/60 animate-pulse" />
            </div>
          </div>
        ) : profile?.connected ? (
          <motion.div
            whileHover={{ y: -3, scale: 1.008 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-200/50 dark:border-emerald-800/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm p-5 flex items-center gap-4 cursor-default"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
            <div className="relative w-11 h-11 rounded-full border-2 border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {providerDisplayName} Connected
                {profile.account_login && (
                  <span className="font-normal text-blue-500 ml-1.5">· {profile.account_login}</span>
                )}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {provider === "github" ? "GitHub App installed and active" : "Bitbucket OAuth connected"}
              </p>
            </div>
            {profile.repositories_count != null && (
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  <AnimatedCount to={profile.repositories_count} />
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">repos</p>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ y: -3, scale: 1.008 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
            className="relative overflow-hidden rounded-2xl border border-amber-200/50 dark:border-amber-800/30 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm p-5 flex items-center gap-4 cursor-default"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            <div className="w-11 h-11 rounded-full border-2 border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 flex items-center justify-center shadow-sm shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{providerDisplayName} Not Connected</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {provider === "github"
                  ? "GitHub App is not installed for this workspace"
                  : "Bitbucket is not connected for this workspace"}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      {repos.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-5"
        >
          {[
            { label: "Total Repos",  value: repos.length,                                         icon: GitBranch, via: "via-blue-500/30",    iconBg: "bg-blue-50 dark:bg-blue-500/10",    iconColor: "text-blue-500",    numColor: "text-blue-600 dark:text-blue-400",    border: "border-blue-200/50 dark:border-blue-800/30"    },
            { label: "Open Issues",  value: repos.reduce((a, r) => a + r.openSuggestions, 0),     icon: Zap,       via: "via-violet-500/30",   iconBg: "bg-violet-50 dark:bg-violet-500/10", iconColor: "text-violet-500",  numColor: "text-violet-600 dark:text-violet-400",  border: "border-violet-200/50 dark:border-violet-800/30" },
            { label: "Resolved",     value: repos.reduce((a, r) => a + r.resolvedSuggestions, 0), icon: Shield,    via: "via-emerald-500/30",  iconBg: "bg-emerald-50 dark:bg-emerald-500/10",iconColor: "text-emerald-500", numColor: "text-emerald-600 dark:text-emerald-400",border: "border-emerald-200/50 dark:border-emerald-800/30"},
          ].map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 + i * 0.07 }}
                whileHover={{ y: -3, scale: 1.01 }}
                className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800/50 shadow-sm p-5 flex items-center gap-4 cursor-default ${stat.border}`}
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent ${stat.via} to-transparent`} />
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stat.numColor}`}>
                    <AnimatedCount to={stat.value} duration={1.3} />
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{stat.label}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* ── Repository list ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
      >
        <div className="overflow-hidden rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-white dark:bg-slate-900/50 shadow-md">

          {/* card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-gradient-to-r from-slate-50 to-transparent dark:from-slate-800/30">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2">
                <GitBranch className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Connected Repositories</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Available for code review and security scanning</p>
              </div>
            </div>
            {repos.length > 0 && (
              <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20 px-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                <AnimatedCount to={repos.length} />
              </span>
            )}
          </div>

          <div className="p-4 space-y-2">
            {loading ? (
              <div className="py-14 flex flex-col items-center gap-3">
                <div className="relative mb-2 h-12 w-12">
                  <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading repositories…</p>
              </div>
            ) : repos.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <GitBranch className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No repositories found</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                  {provider === "github"
                    ? "Install the GitHub App and grant access to your repositories."
                    : "Connect Bitbucket and grant access to repositories."}
                </p>
              </div>
            ) : (
              repos.map((repo, idx) => (
                <motion.div
                  key={repo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.04 * idx, duration: 0.3 }}
                  whileHover={{ scale: 1.008, y: -2 }}
                  className="group flex items-center justify-between p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-slate-50/60 dark:bg-slate-800/30 hover:bg-blue-50/40 hover:border-blue-200/50 dark:hover:bg-slate-800/60 dark:hover:border-blue-500/20 transition-colors duration-150 cursor-default"
                >
                  {/* avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
                      {repo.owner?.avatar_url
                        ? <img src={repo.owner.avatar_url} alt={repo.owner.login || repo.name} className="w-full h-full object-cover" />
                        : <GitBranch className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">
                          {repo.owner?.login ? `${repo.owner.login}/${repo.name}` : repo.full_name || repo.name}
                        </span>
                        {repo.private && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 rounded-full">
                            Private
                          </Badge>
                        )}
                        {repo.language && (
                          <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: langColor[repo.language] ?? langColor.default }} />
                            {repo.language}
                          </span>
                        )}
                      </div>
                      {repo.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-sm">{repo.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {repo.risk && (
                          <Badge className={`text-[10px] px-2 py-0 rounded-full font-medium ${riskStyle[repo.risk] ?? riskStyle.Critical}`}>
                            {repo.risk} Risk
                          </Badge>
                        )}
                        {repo.score !== null && (
                          <Badge className="text-[10px] px-2 py-0 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                            Score: {repo.score}
                          </Badge>
                        )}
                        {repo.totalSuggestions > 0 && (
                          <Badge className="text-[10px] px-2 py-0 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                            {repo.openSuggestions} open · {repo.totalSuggestions} total
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* external link */}
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => window.open(repo.html_url, "_blank")}
                    className="ml-3 w-8 h-8 rounded-lg border border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/50 dark:hover:border-blue-500/20 flex items-center justify-center text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-150 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              ))
            )}

            {/* pagination */}
            {repos.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-200/50 dark:border-slate-800/50 mt-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">Page {page}</span>
                <div className="flex gap-2">
                  {[
                    { label: "Previous", action: () => setPage(page - 1), disabled: page === 1 || loading },
                    { label: "Next",     action: () => setPage(page + 1), disabled: repos.length < pageSize || loading },
                  ].map((btn) => (
                    <motion.button
                      key={btn.label}
                      whileHover={!btn.disabled ? { scale: 1.04 } : {}}
                      whileTap={!btn.disabled  ? { scale: 0.96 } : {}}
                      onClick={btn.action}
                      disabled={btn.disabled}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200/70 dark:border-slate-700/70 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200/50 dark:hover:border-blue-500/20 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                    >
                      {btn.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CodeReviewConnect;
