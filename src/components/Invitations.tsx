import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Send, Mail, Clock, Building2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface OrganisationInvitation {
  id: string;
  organisation_name: string;
  role: 'org_admin' | 'org_member';
  created_at: string;
  expires_at: string;
  token: string;
  status: string;
  invited_by_email?: string;
  email?: string;
}

function fmtDate(d: string) {
  try { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return d; }
}

function StatusPill({ status }: { status: string }) {
  const s = status?.toLowerCase();
  if (s === 'accepted') return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-500/20">
      <CheckCircle className="h-3 w-3" /> Accepted
    </span>
  );
  if (s === 'cancelled' || s === 'canceled') return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-500/20">
      <XCircle className="h-3 w-3" /> Cancelled
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-500/20">
      <AlertCircle className="h-3 w-3" /> Pending
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'org_admin';
  return (
    <span className={`rounded-lg px-2 py-0.5 text-[11px] font-bold border ${
      isAdmin
        ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200/60 dark:border-blue-500/20'
        : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-white/10'
    }`}>
      {isAdmin ? 'Admin' : 'Member'}
    </span>
  );
}

export default function Invitations() {
  const [received, setReceived] = useState<OrganisationInvitation[]>([]);
  const [sent, setSent] = useState<OrganisationInvitation[]>([]);
  const [loadingReceived, setLoadingReceived] = useState(true);
  const [loadingSent, setLoadingSent] = useState(true);
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchReceived = async () => {
    setLoadingReceived(true);
    try {
      const data = await apiService.getMyInvitations('received');
      setReceived(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load received invitations', variant: 'destructive' });
    } finally {
      setLoadingReceived(false);
    }
  };

  const fetchSent = async () => {
    setLoadingSent(true);
    try {
      const data = await apiService.getMyInvitations('sent');
      setSent(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load sent invitations', variant: 'destructive' });
    } finally {
      setLoadingSent(false);
    }
  };

  useEffect(() => {
    fetchReceived();
    fetchSent();
  }, []);

  const handleAccept = async (inv: OrganisationInvitation) => {
    setAccepting(inv.id);
    try {
      await apiService.acceptOrganisationInvitation(inv.token);
      toast({ title: 'Invitation accepted', description: `You now have access to ${inv.organisation_name}.` });
      fetchReceived();
    } catch (e: any) {
      const msg = e?.body?.error || e.message || 'Failed to accept invitation';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setAccepting(null);
    }
  };

  const handleCancel = async (inv: OrganisationInvitation) => {
    setCancelling(inv.id);
    try {
      await apiService.cancelInvitation(inv.id);
      toast({ title: 'Invitation cancelled', description: `The invite to ${inv.email || 'this user'} has been cancelled.` });
      fetchSent();
    } catch (e: any) {
      const msg = e?.body?.error || e.message || 'Failed to cancel invitation';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setCancelling(null);
    }
  };

  const pendingReceived = received.filter(i => i.status === 'pending').length;
  const pendingSent = sent.filter(i => i.status === 'pending').length;

  return (
    <div className="p-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
          <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Invitations</h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Manage your organisation invites</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 p-1 bg-slate-100/80 dark:bg-white/5 rounded-[14px] w-fit">
        {(['received', 'sent'] as const).map(t => {
          const count = t === 'received' ? pendingReceived : pendingSent;
          return (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative flex items-center gap-2 rounded-[10px] px-4 py-1.5 text-xs font-semibold transition-all duration-150 ${
                tab === t
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-200/60 dark:ring-white/10'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t === 'received' ? <Mail className="h-3.5 w-3.5" /> : <Send className="h-3.5 w-3.5" />}
              <span className="capitalize">{t}</span>
              {count > 0 && (
                <span className="flex items-center justify-center h-4 min-w-[16px] rounded-full bg-emerald-500 text-white text-[10px] font-bold px-1">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Received */}
      {tab === 'received' && (
        <div className="space-y-3">
          {loadingReceived ? (
            <div className="flex h-40 items-center justify-center rounded-[18px] border border-dashed border-slate-200 dark:border-blue-900/20">
              <p className="text-sm text-slate-400">Loading…</p>
            </div>
          ) : received.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-[18px] border border-dashed border-slate-200 dark:border-blue-900/20 gap-2">
              <Mail className="h-7 w-7 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No invitations received</p>
            </div>
          ) : (
            received.map(inv => (
              <div
                key={inv.id}
                className="rounded-[18px] border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829] p-5 transition-shadow hover:shadow-md dark:hover:shadow-blue-950/40"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                      <Building2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        Join {inv.organisation_name}
                      </p>
                      {inv.invited_by_email && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          from {inv.invited_by_email}
                        </p>
                      )}
                    </div>
                  </div>
                  <RoleBadge role={inv.role} />
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    Sent {fmtDate(inv.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    Expires {fmtDate(inv.expires_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <StatusPill status={inv.status} />
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => handleAccept(inv)}
                      disabled={accepting === inv.id}
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-semibold px-4 py-1.5 transition-colors"
                    >
                      {accepting === inv.id ? 'Accepting…' : 'Accept'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Sent */}
      {tab === 'sent' && (
        <div className="space-y-3">
          {loadingSent ? (
            <div className="flex h-40 items-center justify-center rounded-[18px] border border-dashed border-slate-200 dark:border-blue-900/20">
              <p className="text-sm text-slate-400">Loading…</p>
            </div>
          ) : sent.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 rounded-[18px] border border-dashed border-slate-200 dark:border-blue-900/20 gap-2">
              <Send className="h-7 w-7 text-slate-300 dark:text-slate-700" />
              <p className="text-sm text-slate-400 dark:text-slate-500">No invitations sent</p>
            </div>
          ) : (
            sent.map(inv => (
              <div
                key={inv.id}
                className="rounded-[18px] border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829] p-5 transition-shadow hover:shadow-md dark:hover:shadow-blue-950/40"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5">
                      <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {inv.email || 'Unknown recipient'}
                      </p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                        {inv.organisation_name}
                      </p>
                    </div>
                  </div>
                  <RoleBadge role={inv.role} />
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    Sent {fmtDate(inv.created_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3 shrink-0" />
                    Expires {fmtDate(inv.expires_at)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <StatusPill status={inv.status} />
                  {inv.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(inv)}
                      disabled={cancelling === inv.id}
                      className="rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-60 text-red-600 dark:text-red-400 text-xs font-semibold px-4 py-1.5 transition-colors"
                    >
                      {cancelling === inv.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
