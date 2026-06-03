import React, { useEffect, useState, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface HeatmapCardProps {
  platformId: string;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const LEGEND: [string, string][] = [
  ['rgba(37,99,235,0.7)',  'Clean'],
  ['rgba(245,158,11,0.8)', 'Mixed'],
  ['rgba(239,68,68,0.85)', 'Threat'],
];

const HeatmapCard: React.FC<HeatmapCardProps> = ({ platformId }) => {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);

  useEffect(() => {
    if (!platformId) return;
    const baseURL = (import.meta as any).env?.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';
    const token = localStorage.getItem('auth_token');
    fetch(`${baseURL}/platforms/${platformId}/heatmap/`, {
      headers: token ? { Authorization: `Token ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.heatmap) setHeatmapData(d.heatmap); })
      .catch(() => {});
  }, [platformId]);

  const { grid, maxTotal } = useMemo(() => {
    const g: Record<number, Record<number, { total: number; blocked: number }>> = {};
    for (let d = 0; d < 7; d++) {
      g[d] = {};
      for (let h = 0; h < 24; h++) g[d][h] = { total: 0, blocked: 0 };
    }
    let max = 1;
    heatmapData.forEach((row: any) => {
      const d = ((Number(row.weekday) - 2) + 7) % 7;
      const h = Number(row.hour);
      if (d >= 0 && d < 7 && h >= 0 && h < 24) {
        const total = Number(row.total) || 0;
        const blocked = Number(row.blocked) || 0;
        g[d][h] = { total, blocked };
        if (total > max) max = total;
      }
    });
    return { grid: g, maxTotal: max };
  }, [heatmapData]);

  return (
    <Card className="bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 rounded-[22px] overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 p-6 pb-4 border-b border-slate-100 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]">
        <div>
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Attack Heatmap</CardTitle>
          <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            Request volume by hour · last 30 days · hover a cell for details
          </CardDescription>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-400 dark:text-slate-500">
          {LEGEND.map(([bg, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-[3px]" style={{ background: bg }} />
              {label}
            </span>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-6 pt-5">
        {heatmapData.length === 0 ? (
          <div className="flex h-40 items-center justify-center border border-dashed border-slate-200 dark:border-blue-900/20 rounded-[14px]">
            <div className="text-center">
              <Activity className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
              <p className="text-xs text-slate-400 dark:text-slate-500">No data for the last 30 days</p>
            </div>
          </div>
        ) : (
          <div className="w-full">

            {/* Hour axis */}
            <div className="flex gap-1 mb-3 pl-12">
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 flex justify-center">
                  {h % 4 === 0 && (
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                      {String(h).padStart(2, '0')}
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Day rows */}
            <div className="flex flex-col gap-2">
              {DAYS.map((day, d) => (
                <div key={day} className="flex items-center gap-1">
                  {/* Day label */}
                  <span className="w-12 shrink-0 text-right pr-3 text-[11px] font-semibold text-slate-400 dark:text-slate-500 tracking-wide">
                    {day}
                  </span>

                  {/* Hour cells */}
                  <div className="flex flex-1 gap-1">
                    {Array.from({ length: 24 }, (_, h) => {
                      const cell = grid[d][h];
                      const intensity = cell.total > 0 ? cell.total / maxTotal : 0;
                      const blockRatio = cell.total > 0 ? cell.blocked / cell.total : 0;
                      const bg = cell.total === 0
                        ? undefined
                        : blockRatio > 0.5
                          ? `rgba(239,68,68,${(0.2 + intensity * 0.7).toFixed(2)})`
                          : blockRatio > 0.2
                            ? `rgba(245,158,11,${(0.2 + intensity * 0.7).toFixed(2)})`
                            : `rgba(37,99,235,${(0.12 + intensity * 0.78).toFixed(2)})`;

                      return (
                        <div
                          key={h}
                          className={`relative group flex-1 rounded-[4px] cursor-default transition-transform hover:scale-110 hover:z-10 ${
                            cell.total === 0 ? 'bg-slate-100 dark:bg-white/[0.06]' : ''
                          }`}
                          style={{ height: 22, ...(bg ? { background: bg } : {}) }}
                        >
                          {cell.total > 0 && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 opacity-0 group-hover:opacity-100 transition-opacity duration-100 whitespace-nowrap">
                              <div className="rounded-lg px-3 py-2 text-[11px] font-semibold shadow-xl bg-slate-900 text-white">
                                <span className="text-slate-300">{day} {String(h).padStart(2, '0')}:00</span>
                                <span className="mx-2 text-slate-600">·</span>
                                <span>{cell.total} req</span>
                                {cell.blocked > 0 && (
                                  <span className="ml-2 text-red-400">{cell.blocked} blocked</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeatmapCard;
