import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Shield, Plus, Activity, Globe, Settings, Eye,
  Server, Zap, AlertTriangle, Trash2, X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/services/api';
import { usePlatform } from '@/contexts/PlatformContext';

interface Platform {
  id: string;
  name: string;
  environment: string;
  deployment_type: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  total_requests?: number;
  blocked_threats?: number;
  active_endpoints?: number;
}

// Animated counter
const AnimCount = ({ value, duration = 900 }: { value: number; duration?: number }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n.toLocaleString()}</>;
};

const Platforms = () => {
  const [platforms, setPlatforms]       = useState<Platform[]>([]);
  const [loading, setLoading]           = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Platform | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate     = useNavigate();
  const { toast }    = useToast();
  const { setSelectedPlatformId } = usePlatform();

  useEffect(() => {
    const fetch_ = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/platforms/`, {
          credentials: 'include',
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || 'Failed');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        setPlatforms(list);
        localStorage.setItem('user_platforms', JSON.stringify(list));
      } catch (e: any) {
        toast({ title: 'Error loading workspaces', description: e.message, variant: 'destructive' });
      } finally { setLoading(false); }
    };
    fetch_();
  }, [toast]);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (openDropdownId) {
        const ref = dropdownRefs.current[openDropdownId];
        if (ref && !ref.contains(e.target as Node)) setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [openDropdownId]);

  useEffect(() => {
    document.body.style.overflow = deleteTarget ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [deleteTarget]);

  const handleSelect = (p: Platform) => { setSelectedPlatformId(p.id); navigate(`/platforms/${p.id}`); };

  const handleDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/platforms/${deleteTarget.id}/`, {
        method: 'DELETE', credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Token ${token}` } : {}) },
      });
      if (!res.ok && res.status !== 204) throw new Error((await res.json().catch(() => ({}))).detail || `HTTP ${res.status}`);
      setPlatforms(prev => prev.filter(p => p.id !== deleteTarget.id));
      toast({ title: 'Workspace deleted', description: `"${deleteTarget.name}" permanently deleted.` });
      setDeleteTarget(null);
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e.message, variant: 'destructive' });
    } finally { setIsDeleting(false); }
  };

  const statusCfg = (s: string) => ({
    active:      { dot: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/25', label: 'Active',      pulse: true },
    inactive:    { dot: 'bg-slate-400',   text: 'text-slate-500 dark:text-slate-400',     bg: 'bg-slate-100 dark:bg-slate-800/60',    border: 'border-slate-200 dark:border-slate-700/40',    label: 'Inactive',   pulse: false },
    maintenance: { dot: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/25',    label: 'Maintenance', pulse: false },
  }[s] ?? { dot: 'bg-slate-400', text: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', label: s, pulse: false });

  const envCfg = (e: string) => ({
    production:  { icon: <Globe className="h-3 w-3" />,         color: 'text-red-500 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200 dark:border-red-500/25',    label: 'Production'  },
    staging:     { icon: <AlertTriangle className="h-3 w-3" />, color: 'text-amber-500 dark:text-amber-400',bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/25',label: 'Staging'     },
    development: { icon: <Settings className="h-3 w-3" />,      color: 'text-blue-500 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-500/10',   border: 'border-blue-200 dark:border-blue-500/25',  label: 'Development' },
  }[e] ?? { icon: <Globe className="h-3 w-3" />, color: 'text-slate-500', bg: 'bg-slate-100', border: 'border-slate-200', label: e });

  const totalReq     = platforms.reduce((s, p) => s + Number(p.total_requests  || 0), 0);
  const totalBlocked = platforms.reduce((s, p) => s + Number(p.blocked_threats || 0), 0);
  const activeCount  = platforms.filter(p => p.status === 'active').length;

  // Delete modal
  const deleteModal = deleteTarget ? ReactDOM.createPortal(
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null); }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 420, damping: 28 }}
        className="relative mx-4 w-full max-w-md rounded-3xl bg-white dark:bg-[#111c2e] border border-slate-200/60 dark:border-blue-900/25 p-7 shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red-500 to-transparent" />
        <button onClick={() => !isDeleting && setDeleteTarget(null)} disabled={isDeleting}
          className="absolute right-4 top-4 h-8 w-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="h-4 w-4" />
        </button>
        <div className="mb-5 h-12 w-12 flex items-center justify-center rounded-2xl border border-red-200 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10">
          <Trash2 className="h-5 w-5 text-red-500" />
        </div>
        <h2 className="mb-1.5 text-lg font-bold text-slate-900 dark:text-white">Delete workspace?</h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          You're about to permanently delete <span className="font-semibold text-slate-900 dark:text-white">"{deleteTarget.name}"</span> and all its data.
        </p>
        <div className="mb-6 rounded-2xl border border-red-200/70 bg-red-50/80 dark:border-red-500/20 dark:bg-red-500/5 px-4 py-3">
          <p className="text-sm text-red-600 dark:text-red-400 leading-relaxed">
            This action <strong>cannot be undone</strong>. Endpoints, threat logs, alerts, and config will be removed permanently.
          </p>
        </div>
        <button onClick={handleDelete} disabled={isDeleting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 hover:bg-red-700 text-sm font-semibold text-white transition-colors disabled:opacity-60">
          {isDeleting ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"/>Deleting…</> : 'Yes, delete permanently'}
        </button>
      </motion.div>
    </motion.div>,
    document.body
  ) : null;

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F8FF] dark:bg-[#0F1724]">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-14 w-14 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/25">
          <Server className="h-6 w-6 text-white animate-pulse" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading workspaces…</p>
      </div>
    </div>
  );

  return (
    <>
    <div className="min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-5 py-6 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header card ── */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-3xl bg-white dark:bg-[#111c2e] border border-slate-200/60 dark:border-blue-900/20 shadow-sm overflow-hidden">

          <div className="p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 flex-1">
                {/* Title + badges */}
                <div className="flex flex-wrap items-center gap-3 mb-3">
                  <h1 className="text-[2rem] font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                    Your Workspaces
                  </h1>
                  {platforms.length > 0 && (
                    <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                      {platforms.length} total
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"/>
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"/>
                    </span>
                    {activeCount} active
                  </span>
                </div>

                <p className="max-w-2xl text-sm text-slate-500 dark:text-slate-400 leading-6">
                  Manage workspace environments, monitor request activity, review security posture, and open each platform dashboard from one place.
                </p>

                {/* Summary chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { label: 'Total Requests', value: totalReq.toLocaleString() },
                    { label: 'Blocked Threats', value: totalBlocked.toLocaleString() },
                    { label: 'Workspaces', value: String(platforms.length) },
                  ].map(({ label, value }) => (
                    <span key={label} className="inline-flex items-center gap-2 rounded-xl border border-slate-200/70 bg-slate-50 dark:border-slate-700/50 dark:bg-slate-800/40 px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-white">{value}</span>
                      <span className="text-slate-400 dark:text-slate-500">{label}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0">
                <button onClick={() => navigate('/onboarding')}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-blue-500/25 transition-all active:scale-[0.98]">
                  <Plus className="h-4 w-4" />
                  Create Workspace
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Grid ── */}
        {platforms.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-white dark:bg-[#111c2e] border border-slate-200/60 dark:border-blue-900/20 p-16 text-center shadow-sm">
            <div className="mx-auto mb-5 h-16 w-16 flex items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">No workspaces yet</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400 dark:text-slate-500">
              Create your first security workspace to start monitoring and protecting your APIs.
            </p>
            <button onClick={() => navigate('/onboarding')}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-500 hover:to-cyan-400 transition-all">
              <Plus className="h-4 w-4" />Create Your First Workspace
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {platforms.map((platform, i) => {
              const sc  = statusCfg(platform.status);
              const ec  = envCfg(platform.environment);
              const br  = platform.total_requests
                ? (((platform.blocked_threats || 0) / platform.total_requests) * 100).toFixed(1)
                : '0.0';
              const isOpen = openDropdownId === platform.id;

              // Env accent colour for card top border
              const accentGrad =
                platform.environment === 'production' ? 'from-red-500 to-rose-500' :
                platform.environment === 'staging'    ? 'from-amber-500 to-orange-500' :
                'from-blue-600 to-cyan-500';

              return (
                <motion.div key={platform.id}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative flex flex-col rounded-3xl bg-white dark:bg-[#111c2e] border border-slate-200/60 dark:border-blue-900/20 shadow-sm hover:shadow-md dark:hover:shadow-black/20 hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
                >
                  <div className="flex-1 p-5">
                    {/* Row 1: icon + name + status + settings */}
                    <div className="flex items-start gap-3 mb-4">
                      {/* Icon */}
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${accentGrad} shadow-md`}
                        style={{ boxShadow: platform.environment === 'production' ? '0 4px 12px rgba(239,68,68,0.2)' : platform.environment === 'staging' ? '0 4px 12px rgba(245,158,11,0.2)' : '0 4px 12px rgba(37,99,235,0.2)' }}>
                        <Server className="h-5 w-5 text-white" />
                      </div>

                      {/* Name + tags */}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white tracking-tight mb-1.5">
                          {platform.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-semibold ${ec.border} ${ec.bg} ${ec.color}`}>
                            {ec.icon}{ec.label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">·</span>
                          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                            {platform.deployment_type === 'saas' ? 'SaaS' : 'On-Premises'}
                          </span>
                        </div>
                      </div>

                      {/* Status + gear */}
                      <div className="flex flex-shrink-0 items-center gap-1.5 ml-auto">
                        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-[10px] font-semibold ${sc.bg} ${sc.text} ${sc.border}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot} ${sc.pulse ? 'animate-pulse' : ''}`}/>
                          {sc.label}
                        </span>
                        <div className="relative" ref={el => { dropdownRefs.current[platform.id] = el; }}>
                          <button
                            onClick={() => setOpenDropdownId(isOpen ? null : platform.id)}
                            className={`h-7 w-7 flex items-center justify-center rounded-xl border text-slate-400 dark:text-slate-500 transition-all ${
                              isOpen
                                ? 'border-blue-300/60 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'border-slate-200/60 dark:border-blue-900/20 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                          ><Settings className="h-3.5 w-3.5"/></button>
                          <AnimatePresence>
                            {isOpen && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                                className="absolute right-0 top-full mt-1.5 w-44 z-50 rounded-2xl bg-white dark:bg-[#111c2e] border border-slate-200/60 dark:border-blue-900/20 shadow-xl overflow-hidden py-1.5"
                              >
                                <button
                                  onClick={() => { setDeleteTarget(platform); setOpenDropdownId(null); }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors rounded-xl mx-0"
                                ><Trash2 className="h-3.5 w-3.5"/>Delete workspace</button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="mb-4 h-px bg-slate-100 dark:bg-blue-900/20"/>

                    {/* Stats — 3 boxes like in screenshot */}
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        { icon: <Activity className="h-4 w-4 text-blue-500 dark:text-blue-400"/>, val: platform.total_requests?.toLocaleString() || '0', label: 'Requests', cls: 'text-slate-900 dark:text-white' },
                        { icon: <Zap className="h-4 w-4 text-red-500 dark:text-red-400"/>,      val: platform.blocked_threats?.toLocaleString()  || '0', label: 'Blocked',  cls: 'text-red-500 dark:text-red-400' },
                        { icon: <Globe className="h-4 w-4 text-emerald-500 dark:text-emerald-400"/>, val: String(platform.active_endpoints || '0'), label: 'Endpoints', cls: 'text-slate-900 dark:text-white' },
                      ].map(s => (
                        <div key={s.label} className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0d1829]/60 py-3 px-2 text-center gap-1">
                          {s.icon}
                          <span className={`text-base font-bold tabular-nums leading-none ${s.cls}`}>{s.val}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{s.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Block rate */}
                    {platform.total_requests ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Block rate</span>
                          <span className="text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-300">{br}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(parseFloat(br), 100)}%` }}
                            transition={{ duration: 1, delay: 0.1 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500"
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* CTA button */}
                  <div className="px-5 pb-5">
                    <button onClick={() => handleSelect(platform)}
                      className="group/btn relative w-full h-11 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-sm font-semibold text-white shadow-sm shadow-blue-500/15 hover:from-blue-500 hover:to-cyan-400 hover:shadow-md hover:shadow-blue-500/20 transition-all overflow-hidden active:scale-[0.99]">
                      <Eye className="h-4 w-4"/>
                      View Dashboard
                      {/* shimmer sweep */}
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover/btn:translate-x-full transition-transform duration-600"/>
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Add workspace card */}
            <motion.div
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28, delay: platforms.length * 0.05 + 0.05 }}
              onClick={() => navigate('/onboarding')}
              className="group flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-slate-200 dark:border-blue-900/30 bg-transparent hover:border-blue-400 dark:hover:border-blue-600/50 hover:bg-blue-50/40 dark:hover:bg-blue-500/5 transition-all duration-200 cursor-pointer min-h-[200px] p-6"
            >
              <div className="h-12 w-12 flex items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-blue-800/60 group-hover:border-blue-400 dark:group-hover:border-blue-500/60 bg-white dark:bg-[#111c2e] transition-all duration-200 group-hover:scale-105">
                <Plus className="h-5 w-5 text-slate-400 dark:text-slate-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"/>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Add workspace</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Set up a new environment</p>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
    {deleteModal}
    </>
  );
};

export default Platforms;