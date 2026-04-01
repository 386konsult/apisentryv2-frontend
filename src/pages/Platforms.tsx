import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Plus, Activity, Globe, Settings, Eye, Server, Zap, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';
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
          headers: token ? { 'Authorization': `Token ${token}` } : {},
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Failed to fetch platforms');
        }
        const data = await res.json();
        const platformsList = Array.isArray(data) ? data : (data.results || []);
        setPlatforms(platformsList);
        localStorage.setItem('user_platforms', JSON.stringify(platformsList));
      } catch (error) {
        console.error('Error loading platforms:', error);
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

  const handleSelectPlatform = (platform: Platform) => {
    setSelectedPlatformId(platform.id);
    navigate(`/platforms/${platform.id}`);
  };

  const handleCreateNewPlatform = () => {
    navigate('/onboarding');
  };

  const getStatusConfig = (status: string) => {
    const config = {
      active: {
        dot: 'bg-emerald-400',
        ring: 'ring-emerald-400/20',
        text: 'text-emerald-400',
        bg: 'bg-emerald-400/10',
        label: 'Active',
      },
      inactive: {
        dot: 'bg-slate-400',
        ring: 'ring-slate-400/20',
        text: 'text-slate-400',
        bg: 'bg-slate-400/10',
        label: 'Inactive',
      },
      maintenance: {
        dot: 'bg-amber-400',
        ring: 'ring-amber-400/20',
        text: 'text-amber-400',
        bg: 'bg-amber-400/10',
        label: 'Maintenance',
      },
    };
    return config[status as keyof typeof config] || config.inactive;
  };

  const getEnvironmentConfig = (environment: string) => {
    switch (environment) {
      case 'production':
        return { icon: <Globe className="h-4 w-4" />, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Production' };
      case 'staging':
        return { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-400', bg: 'bg-amber-400/10', label: 'Staging' };
      case 'development':
        return { icon: <Settings className="h-4 w-4" />, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Development' };
      default:
        return { icon: <Globe className="h-4 w-4" />, color: 'text-slate-400', bg: 'bg-slate-400/10', label: environment };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
            <Shield className="h-4 w-4 text-blue-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-sm text-muted-foreground font-medium tracking-wide">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">Your Workspaces</h1>
            {platforms.length > 0 && (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500/15 text-blue-400 text-xs font-bold ring-1 ring-blue-500/20">
                {platforms.length}
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm">
            Manage and monitor your security workspaces
          </p>
        </div>
        <Button
          onClick={handleCreateNewPlatform}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all duration-200"
        >
          <Plus className="h-4 w-4" />
          Create New Workspace
        </Button>
      </div>

      {/* ── Empty State ── */}
      {platforms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 dark:bg-muted/5 py-20 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/20">
            <Shield className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold mb-1">No workspaces yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-xs">
            Create your first security workspace to start monitoring and protecting your APIs.
          </p>
          <Button
            onClick={handleCreateNewPlatform}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20"
          >
            <Plus className="h-4 w-4" />
            Create Your First Workspace
          </Button>
        </div>
      ) : (

        /* ── Platform Grid ── */
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {platforms.map((platform) => {
            const statusCfg = getStatusConfig(platform.status);
            const envCfg = getEnvironmentConfig(platform.environment);
            const blockRate = platform.total_requests
              ? ((platform.blocked_threats || 0) / platform.total_requests * 100).toFixed(1)
              : '0.0';

            return (
              <div
                key={platform.id}
                className="group relative rounded-2xl border border-border bg-card dark:bg-card/60 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 hover:-translate-y-0.5 hover:border-blue-500/30"
              >
                {/* Subtle top accent line */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Card Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    {/* Platform icon + name */}
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 ring-1 ring-blue-500/20">
                        <Server className="h-4 w-4 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm leading-tight">{platform.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`flex items-center gap-1 text-xs font-medium ${envCfg.color}`}>
                            {envCfg.icon}
                            {envCfg.label}
                          </span>
                          <span className="text-muted-foreground text-xs">·</span>
                          <span className="text-muted-foreground text-xs">
                            {platform.deployment_type === 'saas' ? 'SaaS' : 'On-Premises'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.ring}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${statusCfg.dot} ${platform.status === 'active' ? 'animate-pulse' : ''}`} />
                      {statusCfg.label}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-border/60 my-4" />

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl bg-muted/40 dark:bg-muted/20 p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Activity className="h-3 w-3 text-blue-400" />
                      </div>
                      <div className="text-lg font-bold tabular-nums">
                        {platform.total_requests?.toLocaleString() || '0'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Requests</div>
                    </div>

                    <div className="rounded-xl bg-muted/40 dark:bg-muted/20 p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Zap className="h-3 w-3 text-red-400" />
                      </div>
                      <div className="text-lg font-bold tabular-nums text-red-500 dark:text-red-400">
                        {platform.blocked_threats?.toLocaleString() || '0'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Blocked</div>
                    </div>

                    <div className="rounded-xl bg-muted/40 dark:bg-muted/20 p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Globe className="h-3 w-3 text-emerald-400" />
                      </div>
                      <div className="text-lg font-bold tabular-nums">
                        {platform.active_endpoints || '0'}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Endpoints</div>
                    </div>
                  </div>

                  {/* Block rate bar */}
                  {platform.total_requests ? (
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Block rate</span>
                        <span className="font-medium tabular-nums">{blockRate}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-muted/50 dark:bg-muted/30 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                          style={{ width: `${Math.min(parseFloat(blockRate), 100)}%` }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Card Footer / Actions */}
                <div className="px-5 pb-5 flex gap-2">
                  <Button
                    onClick={() => handleSelectPlatform(platform)}
                    className="flex-1 h-9 gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm shadow-md shadow-blue-600/20 transition-all duration-200"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 w-9 p-0 border-border hover:bg-muted hover:border-blue-500/30 transition-all duration-200"
                  >
                    <Settings className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Platforms;
