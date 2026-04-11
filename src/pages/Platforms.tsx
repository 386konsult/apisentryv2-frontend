import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Button } from '@/components/ui/button';
import {
  Shield, Plus, Activity, Globe, Settings, Eye,
  Server, Zap, AlertTriangle, Trash2, X,
} from 'lucide-react';
import { motion } from 'framer-motion';
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

const Platforms = () => {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Platform | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setSelectedPlatformId } = usePlatform();

  useEffect(() => {
    const fetchPlatforms = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(`${API_BASE_URL}/platforms/`, {
          method: 'GET',
          credentials: 'include',
          headers: token ? { Authorization: `Token ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch platforms');
        }
        const data = await res.json();
        const platformsList = Array.isArray(data) ? data : data.results || [];
        setPlatforms(platformsList);
        localStorage.setItem('user_platforms', JSON.stringify(platformsList));
      } catch (error: any) {
        toast({
          title: 'Error loading workspaces',
          description: error.message || 'Failed to load your workspaces',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchPlatforms();
  }, [toast]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownId) {
        const ref = dropdownRefs.current[openDropdownId];
        if (ref && !ref.contains(e.target as Node)) setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  useEffect(() => {
    document.body.style.overflow = deleteTarget ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [deleteTarget]);

  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatformId(platform.id);
    navigate(`/platforms/${platform.id}`);
  };

  const handleDeleteWorkspace = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch(`${API_BASE_URL}/platforms/${deleteTarget.id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
      });
      if (!res.ok && res.status !== 204) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.detail || errBody.message || `Delete failed (HTTP ${res.status})`);
      }
      setPlatforms(prev => prev.filter(p => p.id !== deleteTarget.id));
      toast({ title: 'Workspace deleted', description: `"${deleteTarget.name}" has been permanently deleted.` });
      setDeleteTarget(null);
    } catch (error: any) {
      toast({ title: 'Delete failed', description: error.message || 'Could not delete workspace.', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
    }
  };

  const panelClass =
    'border border-slate-200/70 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#111827] dark:shadow-none';
  const softPanelClass =
    'border border-slate-200/70 bg-white dark:border-slate-800/80 dark:bg-[#111827]';
  const primaryButtonClass =
    'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md hover:from-blue-500 hover:to-cyan-400 hover:text-white';

  const getStatusConfig = (status: string) => {
    const config = {
      active:      { dot: 'bg-emerald-400', ring: 'ring-emerald-400/20', text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-500/10', label: 'Active',       pulse: true  },
      inactive:    { dot: 'bg-slate-400',   ring: 'ring-slate-400/20',   text: 'text-slate-500 dark:text-slate-300',     bg: 'bg-slate-100 dark:bg-slate-500/10',   label: 'Inactive',    pulse: false },
      maintenance: { dot: 'bg-amber-400',   ring: 'ring-amber-400/20',   text: 'text-amber-600 dark:text-amber-300',     bg: 'bg-amber-50 dark:bg-amber-500/10',    label: 'Maintenance', pulse: false },
    };
    return config[status as keyof typeof config] || config.inactive;
  };

  const getEnvironmentConfig = (environment: string) => {
    switch (environment) {
      case 'production':  return { icon: <Globe className="h-3.5 w-3.5" />,         color: 'text-red-500 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-500/10',     border: 'border-red-200/70 dark:border-red-500/20',    label: 'Production'  };
      case 'staging':     return { icon: <AlertTriangle className="h-3.5 w-3.5" />, color: 'text-amber-500 dark:text-amber-400',bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200/70 dark:border-amber-500/20',label: 'Staging'     };
      case 'development': return { icon: <Settings className="h-3.5 w-3.5" />,      color: 'text-blue-500 dark:text-blue-400',  bg: 'bg-blue-50 dark:bg-blue-500/10',   border: 'border-blue-200/70 dark:border-blue-500/20',  label: 'Development' };
      default:            return { icon: <Globe className="h-3.5 w-3.5" />,         color: 'text-slate-500 dark:text-slate-400',bg: 'bg-slate-100 dark:bg-slate-500/10',border: 'border-slate-200/70 dark:border-slate-500/20',label: environment   };
    }
  };

  const totalRequests    = platforms.reduce((s, p) => s + Number(p.total_requests  || 0), 0);
  const totalBlocked     = platforms.reduce((s, p) => s + Number(p.blocked_threats || 0), 0);
  const activeWorkspaces = platforms.filter(p => p.status === 'active').length;

  const deleteModal = deleteTarget
    ? ReactDOM.createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={e => { if (e.target === e.currentTarget && !isDeleting) setDeleteTarget(null); }}
        >
          <div className={`relative mx-4 w-full max-w-md rounded-[24px] ${panelClass} p-7 shadow-2xl`}>
            <button
              onClick={() => !isDeleting && setDeleteTarget(null)}
              disabled={isDeleting}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-white disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-200/70 bg-red-50 dark:border-red-500/20 dark:bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-500 dark:text-red-400" />
            </div>

            <h2 className="mb-2 text-lg font-semibold text-slate-950 dark:text-white">
              Delete workspace permanently?
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              You are about to delete{' '}
              <span className="font-semibold text-slate-950 dark:text-white">&ldquo;{deleteTarget.name}&rdquo;</span>{' '}
              and all of its associated data.
            </p>

            <div className="mb-6 rounded-2xl border border-red-200/70 bg-red-50/80 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/[0.08]">
              <p className="text-sm leading-relaxed text-red-600 dark:text-red-400">
                This action <strong>cannot be undone</strong>. All endpoints, threat logs,
                security alerts, and configuration data will be permanently removed.
              </p>
            </div>

            <button
              onClick={handleDeleteWorkspace}
              disabled={isDeleting}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Deleting…
                </>
              ) : (
                'I understand, delete workspace'
              )}
            </button>
          </div>
        </div>,
        document.body,
      )
    : null;

  if (loading) {
    return (
      <div className="-mx-4 -mt-4 min-h-[calc(100vh-64px)] bg-[#F4F8FF] px-4 py-10 dark:bg-[#0F1724] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className={`flex h-72 items-center justify-center rounded-[24px] ${panelClass}`}>
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200/70 bg-white dark:border-slate-700 dark:bg-[#172033]">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500/20 border-t-blue-500" />
            </div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Loading workspaces…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="-mx-4 -mt-4 min-h-[calc(100vh-64px)] bg-[#F4F8FF] px-4 pb-12 pt-6 dark:bg-[#0F1724] sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="space-y-6">

          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`rounded-[24px] ${panelClass} p-6`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[2.1rem] font-semibold leading-none tracking-[-0.04em] text-slate-950 dark:text-white">
                    Your Workspaces
                  </h1>
                  {platforms.length > 0 && (
                    <span className="inline-flex items-center rounded-full border border-blue-200/70 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
                      {platforms.length} total
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {activeWorkspaces} active
                  </span>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Manage workspace environments, monitor request activity, review security posture, and open each platform dashboard from one place.
                </p>
                <p className="mt-2 text-xs font-medium tracking-[0.08em] text-slate-400 dark:text-slate-500">
                  OVERVIEW · SECURITY OPERATIONS
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    `Total Requests: ${totalRequests.toLocaleString()}`,
                    `Blocked Threats: ${totalBlocked.toLocaleString()}`,
                    `Workspaces: ${platforms.length}`,
                  ].map(label => (
                    <span key={label} className="rounded-full border border-slate-200/70 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-white/[0.04] dark:text-slate-300">
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              <div className="lg:pt-1">
                <Button onClick={() => navigate('/onboarding')} className={`${primaryButtonClass} rounded-full px-5`}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Workspace
                </Button>
              </div>
            </div>
          </motion.div>

          {platforms.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className={`rounded-[24px] ${panelClass} p-12 text-center`}
            >
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-200/70 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10">
                <Shield className="h-8 w-8 text-blue-500 dark:text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-950 dark:text-white">No workspaces yet</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                Create your first security workspace to start monitoring and protecting your APIs.
              </p>
              <Button onClick={() => navigate('/onboarding')} className={`${primaryButtonClass} mt-6 rounded-full px-5`}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Workspace
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05, ease: 'easeOut' }}
              className="grid gap-5 md:grid-cols-2 lg:grid-cols-3"
            >
              {platforms.map((platform, i) => {
                const statusCfg      = getStatusConfig(platform.status);
                const envCfg         = getEnvironmentConfig(platform.environment);
                const blockRate      = platform.total_requests
                  ? (((platform.blocked_threats || 0) / platform.total_requests) * 100).toFixed(1)
                  : '0.0';
                const isDropdownOpen = openDropdownId === platform.id;

                return (
                  <motion.div
                    key={platform.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.04, ease: 'easeOut' }}
                    className={`
                      group relative flex flex-col rounded-[22px] overflow-hidden
                      transition-all duration-300 hover:-translate-y-0.5
                      hover:shadow-lg dark:hover:shadow-black/30
                      ${panelClass}
                    `}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                    <div className="flex-1 p-5">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-blue-200/70 bg-blue-50 dark:border-blue-500/20 dark:bg-blue-500/10">
                            <Server className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-sm font-semibold tracking-[-0.01em] text-slate-950 dark:text-white">
                              {platform.name}
                            </h3>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${envCfg.border} ${envCfg.bg} ${envCfg.color}`}>
                                {envCfg.icon}
                                {envCfg.label}
                              </span>
                              <span className="text-xs text-slate-400 dark:text-slate-600">·</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {platform.deployment_type === 'saas' ? 'SaaS' : 'On-Premises'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 items-center gap-2">
                          <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.ring}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
                            {statusCfg.label}
                          </div>

                          <div className="relative" ref={el => { dropdownRefs.current[platform.id] = el; }}>
                            <button
                              onClick={() => setOpenDropdownId(isDropdownOpen ? null : platform.id)}
                              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all duration-150 ${
                                isDropdownOpen
                                  ? 'border-blue-300/70 bg-slate-100 text-slate-900 dark:border-blue-500/20 dark:bg-white/[0.06] dark:text-white'
                                  : 'border-slate-200/70 bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-500 dark:hover:bg-white/[0.06] dark:hover:text-white'
                              }`}
                            >
                              <Settings className="h-3.5 w-3.5" />
                            </button>

                            {isDropdownOpen && (
                              <div className="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200/70 bg-white py-1 shadow-lg dark:border-slate-800 dark:bg-[#111827]">
                                <button
                                  onClick={() => { setDeleteTarget(platform); setOpenDropdownId(null); }}
                                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-sm text-red-500 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete workspace
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4 h-px bg-slate-200/70 dark:bg-slate-800" />

                      <div className="grid grid-cols-3 gap-2.5">
                        {[
                          { icon: <Activity className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400" />,       value: platform.total_requests?.toLocaleString()  || '0', label: 'Requests',  cls: 'text-slate-950 dark:text-white' },
                          { icon: <Zap      className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />,         value: platform.blocked_threats?.toLocaleString() || '0', label: 'Blocked',   cls: 'text-red-500 dark:text-red-400' },
                          { icon: <Globe    className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />, value: String(platform.active_endpoints || '0'),          label: 'Endpoints', cls: 'text-slate-950 dark:text-white' },
                        ].map(stat => (
                          <div key={stat.label} className={`rounded-xl p-3 text-center ${softPanelClass}`}>
                            <div className="mb-1 flex justify-center">{stat.icon}</div>
                            <div className={`text-base font-semibold tabular-nums ${stat.cls}`}>{stat.value}</div>
                            <div className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">{stat.label}</div>
                          </div>
                        ))}
                      </div>

                      {platform.total_requests ? (
                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">Block rate</span>
                            <span className="font-medium tabular-nums text-slate-700 dark:text-slate-300">{blockRate}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70 dark:bg-slate-800">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                              style={{ width: `${Math.min(parseFloat(blockRate), 100)}%` }}
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <div className="px-5 pb-5">
                      <Button
                        onClick={() => handleSelectPlatform(platform)}
                        className={`${primaryButtonClass} h-10 w-full rounded-xl`}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Dashboard
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      {deleteModal}
    </>
  );
};

export default Platforms;