import React, { useEffect, useState, useRef } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface LiveFeedCardProps {
  platformId: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET:    'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10',
  POST:   'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
  PUT:    'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10',
  PATCH:  'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10',
  DELETE: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Backend returns "DD-MM-YYYY HH:MM" — not ISO, so new Date() can't parse it directly.
function parseTs(ts: string | undefined): Date | null {
  if (!ts) return null;
  // Try ISO first (future-proof)
  let d = new Date(ts);
  if (!isNaN(d.getTime())) return d;
  // Handle "DD-MM-YYYY HH:MM" and "DD-MM-YYYY HH:MM:SS"
  const m = ts.match(/^(\d{2})-(\d{2})-(\d{4})[T\s](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, dd, mo, yyyy, hh, mm, ss = '0'] = m;
    d = new Date(Number(yyyy), Number(mo) - 1, Number(dd), Number(hh), Number(mm), Number(ss));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
}

function formatTime(ts: string | undefined): string {
  const d = parseTs(ts);
  if (!d) return '—';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function formatDate(ts: string | undefined): string {
  const d = parseTs(ts);
  if (!d) return '';
  const isToday = d.toDateString() === new Date().toDateString();
  if (isToday) return '';
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

const LiveFeedCard: React.FC<LiveFeedCardProps> = ({ platformId }) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [running, setRunning] = useState(true);
  const [flashIds, setFlashIds] = useState<string[]>([]);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!platformId || !running) return;

    const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

    const poll = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        const res = await fetch(
          `${baseURL}/platforms/${platformId}/request-logs/?ordering=-timestamp&limit=20`,
          { headers: token ? { Authorization: `Token ${token}` } : {} }
        );
        if (!res.ok) return;
        const data = await res.json();
        const results: any[] = Array.isArray(data.logs) ? data.logs : Array.isArray(data.results) ? data.results : [];

        const newIds: string[] = [];
        results.forEach((l: any) => {
          const key = String(l.id ?? l.timestamp ?? '');
          if (key && !seenRef.current.has(key)) {
            newIds.push(key);
            seenRef.current.add(key);
          }
        });

        setLogs(results);
        if (newIds.length > 0) {
          setFlashIds(newIds);
          setTimeout(() => setFlashIds([]), 1400);
        }
      } catch {
        // swallow network errors silently
      }
    };

    poll();
    const timer = setInterval(poll, 5000);
    return () => clearInterval(timer);
  }, [platformId, running]);

  return (
    <Card className="bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 rounded-[22px] overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-4 bg-white dark:bg-[#0d1829]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-red-500/10 ring-1 ring-red-100 dark:ring-red-500/20">
            <Activity className="h-5 w-5 text-red-500 dark:text-red-400" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Live Request Feed
            </CardTitle>
            <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              Polls every 3s · new rows flash · blocked entries glow red
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {running && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              LIVE
            </span>
          )}
          <button
            onClick={() => setRunning(r => !r)}
            className={`rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
              running
                ? 'border-slate-200 dark:border-blue-900/30 bg-white dark:bg-[#0d1829] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-blue-900/10'
                : 'border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            }`}
          >
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {logs.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-blue-900/10 max-h-[420px] overflow-y-auto">
            {logs.map((log: any, idx: number) => {
              const key = String(log.id ?? log.timestamp ?? idx);
              const isNew = flashIds.includes(key);
              const isBlocked = Boolean(log.waf_blocked);
              const isThreat = log.threat_level && log.threat_level !== 'none' && !isBlocked;
              const method = String(log.method || 'GET').toUpperCase();
              const rowBg = isNew
                ? isBlocked
                  ? 'bg-red-50 dark:bg-red-500/10'
                  : isThreat
                    ? 'bg-amber-50 dark:bg-amber-500/10'
                    : 'bg-emerald-50 dark:bg-emerald-500/10'
                : '';
              const timeStr = formatTime(log.timestamp);
              const dateStr = formatDate(log.timestamp);

              return (
                <div
                  key={`${key}-${idx}`}
                  className={`grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-3 px-5 py-3 transition-colors duration-700 ${rowBg}`}
                >
                  <span className={`shrink-0 rounded-md px-2 py-0.5 font-mono text-[10px] font-bold ${METHOD_COLORS[method] || 'text-slate-500 bg-slate-100 dark:bg-slate-800'}`}>
                    {method}
                  </span>

                  <span className="min-w-0 truncate font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {log.path || '/'}
                  </span>

                  <span className="shrink-0 font-mono text-[11px] text-slate-400 dark:text-slate-500">
                    {log.client_ip || '—'}
                  </span>

                  {/* Timestamp — time always visible, date shown below when not today */}
                  <div className="shrink-0 flex flex-col items-end gap-0">
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums leading-tight">
                      {timeStr}
                    </span>
                    {dateStr && (
                      <span className="font-mono text-[9px] text-slate-400 dark:text-slate-600 tabular-nums leading-tight">
                        {dateStr}
                      </span>
                    )}
                  </div>

                  <span className={`shrink-0 font-mono text-[11px] font-bold ${
                    Number(log.status_code) >= 500
                      ? 'text-red-500 dark:text-red-400'
                      : Number(log.status_code) >= 400
                        ? 'text-amber-500 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {log.status_code || '—'}
                  </span>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${isBlocked ? 'bg-red-500 animate-pulse' : isThreat ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <span className={`text-[10px] font-bold ${isBlocked ? 'text-red-500 dark:text-red-400' : isThreat ? 'text-amber-500 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {isBlocked ? 'BLOCKED' : isThreat ? 'THREAT' : 'OK'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex h-32 items-center justify-center border border-dashed border-slate-200 dark:border-blue-900/20 m-5 rounded-[14px]">
            <div className="text-center">
              <Activity className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700 animate-spin" />
              <p className="text-xs text-slate-400 dark:text-slate-500">Waiting for requests…</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveFeedCard;
