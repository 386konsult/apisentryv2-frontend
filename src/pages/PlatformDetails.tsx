import { Badge } from "@/components/ui/badge";
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import {
  Shield, AlertTriangle, Activity, TrendingUp,
  Globe, Eye, Plus, Search, Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import apiService from '@/services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic avatar system (mirrors PlatformIndicator / AppSidebar)
// ─────────────────────────────────────────────────────────────────────────────
const djb2 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
};

const AVATAR_TOKENS = [
  { from: "#1e3a8a", to: "#06b6d4", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.95"/><circle cx="3" cy="3" r="1.5" fill="white" fillOpacity="0.6"/><circle cx="17" cy="3" r="1.5" fill="white" fillOpacity="0.6"/><circle cx="3" cy="17" r="1.5" fill="white" fillOpacity="0.6"/><circle cx="17" cy="17" r="1.5" fill="white" fillOpacity="0.6"/><line x1="3" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/><line x1="17" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/><line x1="3" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/><line x1="17" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2"/></svg>) },
  { from: "#312e81", to: "#6366f1", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M3 14 Q6 8 13 5" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round"/><path d="M5 16 Q9 11 15 8" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round"/><circle cx="13.5" cy="4.5" r="2.5" fill="white" fillOpacity="0.9"/><circle cx="13.5" cy="4.5" r="1" fill="white"/></svg>) },
  { from: "#be123c", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M10 3 C6.5 3 4 5.8 4 9 C4 11.5 5 13.5 6.5 15" stroke="white" strokeOpacity="0.95" strokeWidth="1.4" strokeLinecap="round"/><path d="M10 5.5 C7.5 5.5 6 7.2 6 9 C6 10.5 6.8 11.8 8 13" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round"/><path d="M10 8 C9 8 8.5 8.6 8.5 9.2 C8.5 9.8 9 10.8 9.5 11.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round"/></svg>) },
  { from: "#065f46", to: "#14b8a6", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><circle cx="4" cy="5" r="1.8" fill="white" fillOpacity="0.9"/><circle cx="4" cy="10" r="1.8" fill="white" fillOpacity="0.9"/><circle cx="4" cy="15" r="1.8" fill="white" fillOpacity="0.9"/><circle cx="10" cy="7.5" r="1.8" fill="white" fillOpacity="0.75"/><circle cx="10" cy="12.5" r="1.8" fill="white" fillOpacity="0.75"/><circle cx="16" cy="10" r="1.8" fill="white" fillOpacity="0.9"/><line x1="5.8" y1="5.2" x2="8.2" y2="7.3" stroke="white" strokeOpacity="0.5" strokeWidth="1"/><line x1="5.8" y1="10" x2="8.2" y2="7.5" stroke="white" strokeOpacity="0.5" strokeWidth="1"/><line x1="11.8" y1="7.5" x2="14.2" y2="9.8" stroke="white" strokeOpacity="0.5" strokeWidth="1"/></svg>) },
  { from: "#1e1b4b", to: "#7c3aed", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M10 2 L16 5 L16 10 C16 13.5 13 16.5 10 18 C7 16.5 4 13.5 4 10 L4 5 Z" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3"/><rect x="7.5" y="9" width="5" height="4" rx="1" fill="white" fillOpacity="0.9"/><path d="M8.5 9 L8.5 7.5 C8.5 6.4 11.5 6.4 11.5 7.5 L11.5 9" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" fill="none"/></svg>) },
  { from: "#92400e", to: "#fbbf24", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><ellipse cx="10" cy="5.5" rx="6" ry="2" fill="white" fillOpacity="0.9"/><path d="M4 5.5 L4 10 C4 11.1 6.7 12 10 12 C13.3 12 16 11.1 16 10 L16 5.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none"/><path d="M4 10 L4 14.5 C4 15.6 6.7 16.5 10 16.5 C13.3 16.5 16 15.6 16 14.5 L16 10" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none"/></svg>) },
  { from: "#0f172a", to: "#22c55e", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><rect x="2.5" y="4" width="15" height="12" rx="2.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.8" strokeWidth="1.2"/><path d="M5.5 8 L8 10 L5.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><line x1="9.5" y1="12" x2="14" y2="12" stroke="white" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round"/></svg>) },
  { from: "#0c4a6e", to: "#38bdf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><polyline points="2,10 4,10 5,6 6,14 7.5,8 9,13 10.5,7 12,13 13.5,9 15,11 16,10 18,10" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>) },
  { from: "#4338ca", to: "#ec4899", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><polygon points="10,2 13.5,4 13.5,8 10,10 6.5,8 6.5,4" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2"/><circle cx="10" cy="6" r="1.5" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#075985", to: "#7dd3fc", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M5.5 14 C3.5 14 2 12.5 2 10.5 C2 8.8 3.2 7.4 4.9 7.1 C4.5 3.6 6.1 2 8 2 C9.4 2 10.6 2.8 11.2 4 C14.1 3.8 15.6 5.3 15.6 7.2 C16.9 7.9 18 9 18 10.5 C18 12.5 16.4 14 14.5 14" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" fill="none"/><path d="M10 17 L10 10" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round"/><path d="M7.5 12 L10 9.5 L12.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>) },
  { from: "#5b21b6", to: "#d946ef", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M7 2 C7 5 13 6 13 10 C13 14 7 15 7 18" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none"/><path d="M13 2 C13 5 7 6 7 10 C7 14 13 15 13 18" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" fill="none"/><line x1="7.5" y1="10" x2="12.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round"/></svg>) },
  { from: "#064e3b", to: "#10b981", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><text x="2" y="8" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text><text x="10" y="8" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="2" y="13" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="10" y="13" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text></svg>) },
  { from: "#1e293b", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><circle cx="10" cy="10" r="3" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3"/><circle cx="10" cy="10" r="1.2" fill="white" fillOpacity="0.9"/><path d="M10 2.5 L10 4.5 M10 15.5 L10 17.5 M2.5 10 L4.5 10 M15.5 10 L17.5 10" stroke="white" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round"/></svg>) },
  { from: "#1d4ed8", to: "#f472b6", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><rect x="2" y="14" width="3" height="4" rx="1" fill="white" fillOpacity="0.5"/><rect x="6.5" y="11" width="3" height="7" rx="1" fill="white" fillOpacity="0.7"/><rect x="11" y="7.5" width="3" height="10.5" rx="1" fill="white" fillOpacity="0.85"/><rect x="15.5" y="4" width="3" height="14" rx="1" fill="white" fillOpacity="0.95"/></svg>) },
  { from: "#0f766e", to: "#a7f3d0", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none"/><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" transform="rotate(60 10 10)"/><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" transform="rotate(120 10 10)"/><circle cx="10" cy="10" r="1.8" fill="white" fillOpacity="0.95"/></svg>) },
  { from: "#1a2e05", to: "#84cc16", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none"/><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1" fill="none"/><circle cx="10" cy="10" r="2.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none"/><line x1="10" y1="10" x2="10" y2="2.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round"/><circle cx="14.5" cy="5.5" r="1.2" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#713f12", to: "#facc15", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M11.5 2 L5.5 11.5 L9.5 11.5 L8.5 18 L14.5 8.5 L10.5 8.5 Z" fill="white" fillOpacity="0.95"/></svg>) },
  { from: "#0f2744", to: "#22d3ee", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none"/><ellipse cx="10" cy="10" rx="4" ry="7.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none"/><line x1="2.5" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1"/></svg>) },
  { from: "#18181b", to: "#818cf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/><rect x="13" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/><rect x="2" y="13" width="5" height="5" rx="1" fill="white" fillOpacity="0.9"/><rect x="9" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#7f1d1d", to: "#fb923c", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M10 2 C10 2 14 5 14 10 L12.5 13 L7.5 13 L6 10 C6 5 10 2 10 2 Z" fill="white" fillOpacity="0.9"/><circle cx="10" cy="8.5" r="1.8" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.6" strokeWidth="1"/></svg>) },
  { from: "#1d4ed8", to: "#a855f7", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M3.5 10 C3.5 7.5 5.2 5.5 7.5 5.5 C9 5.5 10 6.5 10 6.5 C10 6.5 11 5.5 12.5 5.5 C14.8 5.5 16.5 7.5 16.5 10 C16.5 12.5 14.8 14.5 12.5 14.5 C11 14.5 10 13.5 10 13.5 C10 13.5 9 14.5 7.5 14.5 C5.2 14.5 3.5 12.5 3.5 10 Z" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" fill="none"/></svg>) },
  { from: "#134e4a", to: "#86efac", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><rect x="2.5" y="3" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.2"/><rect x="2.5" y="8" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.65" strokeWidth="1.2"/><rect x="2.5" y="13" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.4" strokeWidth="1.2"/></svg>) },
  { from: "#0f172a", to: "#60a5fa", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><path d="M7 7 L7 5 C7 3.9 7.9 3 9 3 C10.1 3 11 3.9 11 5 L11 7 L13 7 L13 5 C13 3.9 13.9 3 15 3 C16.1 3 17 3.9 17 5 C17 6.1 16.1 7 15 7 L13 7 L13 9 L15 9 C16.1 9 17 9.9 17 11 C17 12.1 16.1 13 15 13 L13 13 L13 15 C13 16.1 12.1 17 11 17 C9.9 17 9 16.1 9 15 L9 13 L7 13 L7 15 C7 16.1 6.1 17 5 17 C3.9 17 3 16.1 3 15 C3 13.9 3.9 13 5 13 L7 13 L7 11 L5 11 C3.9 11 3 10.1 3 9 C3 7.9 3.9 7 5 7 L7 7 Z M9 7 L9 9 L11 9 L11 7 Z M9 11 L9 13 L11 13 L11 11 Z" fill="white" fillOpacity="0.9"/></svg>) },
  { from: "#831843", to: "#fb7185", svg: (<svg viewBox="0 0 20 20" fill="none" width="14" height="14"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none"/><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none"/><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9"/></svg>) },
];

/** Renders a deterministic gradient avatar based on email/name */
const MemberAvatar = ({ email, size = 28 }: { email: string; size?: number }) => {
  const key = (email || "user@heimdall").toLowerCase().trim();
  const hash = djb2(key);
  const token = AVATAR_TOKENS[hash % AVATAR_TOKENS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${token.from}, ${token.to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 0 1.5px ${token.to}40, 0 1px 4px ${token.from}55`,
        position: "relative" as const,
      }}
    >
      {token.svg}
      {/* Online indicator */}
      <span
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: "#22c55e",
          border: "1.5px solid white",
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'];

const TIME_RANGES = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Year', value: '1y' },
];

const getStorageKey = (id: string | undefined) => `heimdall_timeRange_${id ?? 'default'}`;

interface OWASPThreat {
  name: string;
  category: string;
  count: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

interface CountryData {
  code: string;
  name: string;
  count: number;
}

interface PlatformMember {
  id: string;
  user_email: string;
  user_name: string;
  role: string;
  is_owner: boolean;
}

type AnimatedNumberProps = {
  value: number;
  decimals?: number;
  suffix?: string;
  className?: string;
};

const AnimatedNumber = ({ value, decimals = 0, suffix = '', className = '' }: AnimatedNumberProps) => {
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

const PlatformDetails: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [platform, setPlatform] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [wafRules, setWafRules] = useState<any[]>([]);
  const [threatLogs, setThreatLogs] = useState<any[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [threatTypes, setThreatTypes] = useState<any[]>([]);
  const [threatTypesByCategory, setThreatTypesByCategory] = useState<any[]>([]);
  const [owaspThreats, setOwaspThreats] = useState<OWASPThreat[]>([
    { name: 'Broken Access Control', category: 'Access Control', count: 0, severity: 'critical' },
    { name: 'Cryptographic Failures', category: 'Cryptography', count: 0, severity: 'high' },
    { name: 'Injection', category: 'Injection', count: 0, severity: 'critical' },
    { name: 'Insecure Design', category: 'Design', count: 0, severity: 'high' },
    { name: 'Security Misconfiguration', category: 'Configuration', count: 0, severity: 'medium' },
    { name: 'Vulnerable Components', category: 'Components', count: 0, severity: 'high' },
    { name: 'Authentication Failures', category: 'Authentication', count: 0, severity: 'critical' },
    { name: 'Software & Data Integrity', category: 'Integrity', count: 0, severity: 'high' },
    { name: 'Security Logging Failures', category: 'Logging', count: 0, severity: 'medium' },
    { name: 'Server-Side Request Forgery', category: 'SSRF', count: 0, severity: 'high' },
  ]);
  const [countryData, setCountryData] = useState<CountryData[]>([]);
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [platformMembers, setPlatformMembers] = useState<PlatformMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);

  const [timeRange, setTimeRange] = useState<string>(() => {
    try {
      return localStorage.getItem(getStorageKey(id)) || '7d';
    } catch {
      return '7d';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(id), timeRange);
    } catch {}
  }, [timeRange, id]);

  const [isAlertClicked, setIsAlertClicked] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    if (!id) return;
    setLoading(true);

    apiService.getPlatformDetails(id)
      .then((data: any) => { setPlatform(data); setLoading(false); })
      .catch((err: any) => { setError(err?.message ?? 'Failed to load workspace'); setLoading(false); });

    apiService.getAnalytics(id)
      .then((data: any) => {
        if (data?.success && data.analytics) {
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && '1y' in data.analytics) {
            analyticsData = data.analytics['1y'];
          } else {
            analyticsData = data.analytics;
          }
          setAnalytics(analyticsData);
        }
      })
      .catch(() => setAnalytics(null));

    apiService.getPlatformEndpoints(id)
      .then((res: any) => {
        const endpointsArr = Array.isArray(res) ? res : res?.results || [];
        setEndpoints(endpointsArr);
      })
      .catch(() => setEndpoints([]));

    apiService.getPlatformWAFRules(id)
      .then((data: any) => setWafRules(Array.isArray(data) ? data : data?.results || []))
      .catch(() => {});

    apiService.getPlatformMembers(id)
      .then((members: any[]) => {
        const formatted = members.map(m => ({
          id: m.id,
          user_email: m.user_email,
          user_name: m.user_name,
          role: m.role || (m.is_owner ? 'owner' : 'member'),
          is_owner: m.is_owner || false,
        }));
        setPlatformMembers(formatted);
      })
      .catch((err) => console.error('Failed to fetch members:', err))
      .finally(() => setMembersLoading(false));
  };

  const fetchAllRangedData = () => {
    if (!id) return;

    const params = { range: timeRange };

    apiService.getAnalytics(id, params)
      .then((data: any) => {
        if (data?.success && data.analytics) {
          let analyticsData;
          if (typeof data.analytics === 'object' && !Array.isArray(data.analytics) && timeRange in data.analytics) {
            analyticsData = data.analytics[timeRange];
          } else {
            analyticsData = data.analytics;
          }

          if (analyticsData?.method_status_breakdown) {
            const trafficArr = HTTP_METHODS.map((method) => {
              const methodData = analyticsData.method_status_breakdown[method] || {};
              return { method, ...methodData };
            });
            setTrafficData(trafficArr);
          } else {
            setTrafficData([]);
          }

          if (analyticsData?.status_code_breakdown) {
            const colors: Record<string, string> = {
              '200': '#22c55e', '201': '#16a34a', '204': '#10b981',
              '400': '#f97316', '403': '#ef4444', '404': '#6366f1',
              '500': '#eab308', '504': '#06b6d4', other: '#9ca3af',
            };
            const responseCodeArr = Object.entries(analyticsData.status_code_breakdown).map(([name, value]) => ({
              name, value: Number(value), color: colors[name] || colors.other,
            }));
            setThreatTypes(responseCodeArr);
          } else {
            setThreatTypes([]);
          }

          const threatTypeColors: Record<string, string> = {
            'Malicious Payload': '#ef4444', 'XSS Attack Detected': '#f59e0b',
            'Suspicious User Agent': '#8b5cf6', 'Brute Force Attempt': '#dc2626',
            'SQL Injection Detection': '#ec4899', 'Command Injection': '#06b6d4',
            'Path Traversal': '#10b981', 'Rate Limit Exceeded': '#3b82f6',
            'Security Misconfiguration': '#f97316', 'Insecure Direct Object Reference': '#eab308',
            'Broken Authentication': '#14b8a6', 'SQL Injection': '#ef4444',
            XSS: '#f59e0b', 'Brute Force': '#dc2626', CSRF: '#06b6d4',
            XXE: '#10b981', SSRF: '#3b82f6', LFI: '#f97316', RFI: '#eab308',
          };

          if (analyticsData?.threat_type_summary && typeof analyticsData.threat_type_summary === 'object') {
            const threatTypeArr = Object.entries(analyticsData.threat_type_summary)
              .map(([name, value]) => ({ name, value: Number(value), color: threatTypeColors[name] || '#9ca3af' }))
              .filter((item) => item.value > 0)
              .sort((a, b) => b.value - a.value);
            setThreatTypesByCategory(threatTypeArr);
          } else if (analyticsData?.threat_types && typeof analyticsData.threat_types === 'object') {
            const threatTypeArr = Object.entries(analyticsData.threat_types)
              .map(([name, value]) => ({ name, value: Number(value), color: threatTypeColors[name] || '#9ca3af' }))
              .filter((item) => item.value > 0)
              .sort((a, b) => b.value - a.value);
            setThreatTypesByCategory(threatTypeArr);
          } else {
            setThreatTypesByCategory([]);
          }

          if (analyticsData?.country_summary && Array.isArray(analyticsData.country_summary)) {
            const countryArr = analyticsData.country_summary
              .map((item: any) => ({
                code: (item.country_code || '').toUpperCase(),
                name: item.country_name || item.country_code || '',
                count: Number(item.total_requests || 0),
              }))
              .filter((item: CountryData) => item.count > 0 && item.code)
              .sort((a, b) => b.count - a.count);
            setCountryData(countryArr);
          } else if (analyticsData?.country_breakdown || analyticsData?.geographic_breakdown) {
            const countryBreakdown = analyticsData.country_breakdown || analyticsData.geographic_breakdown;
            const countryCodeToName: Record<string, string> = {
              US: 'United States', CN: 'China', RU: 'Russia', GB: 'United Kingdom',
              DE: 'Germany', FR: 'France', IN: 'India', BR: 'Brazil', JP: 'Japan',
              CA: 'Canada', AU: 'Australia', KR: 'South Korea', IT: 'Italy',
              ES: 'Spain', NL: 'Netherlands', MX: 'Mexico', ID: 'Indonesia',
              TR: 'Turkey', SA: 'Saudi Arabia', PL: 'Poland', EG: 'Egypt',
              CH: 'Switzerland', NG: 'Nigeria',
            };
            const countryArr = Object.entries(countryBreakdown)
              .map(([code, count]) => ({
                code: code.toUpperCase(),
                name: countryCodeToName[code.toUpperCase()] || code,
                count: Number(count),
              }))
              .filter((item) => item.count > 0)
              .sort((a, b) => b.count - a.count);
            setCountryData(countryArr);
          } else {
            setCountryData([]);
          }

          if (analyticsData?.owasp_top10_summary && Array.isArray(analyticsData.owasp_top10_summary)) {
            const owaspCategoryMap: Record<string, { name: string; category: string; severity: 'critical' | 'high' | 'medium' | 'low' }> = {
              'A01:2021 – Broken Access Control': { name: 'Broken Access Control', category: 'Access Control', severity: 'critical' },
              'A02:2021 – Cryptographic Failures': { name: 'Cryptographic Failures', category: 'Cryptography', severity: 'high' },
              'A03:2021 – Injection': { name: 'Injection', category: 'Injection', severity: 'critical' },
              'A04:2021 – Insecure Design': { name: 'Insecure Design', category: 'Design', severity: 'high' },
              'A05:2021 – Security Misconfiguration': { name: 'Security Misconfiguration', category: 'Configuration', severity: 'medium' },
              'A06:2021 – Vulnerable Components': { name: 'Vulnerable Components', category: 'Components', severity: 'high' },
              'A07:2021 – Identification and Authentication Failures': { name: 'Authentication Failures', category: 'Authentication', severity: 'critical' },
              'A08:2021 – Software and Data Integrity Failures': { name: 'Software & Data Integrity', category: 'Integrity', severity: 'high' },
              'A09:2021 – Security Logging and Monitoring Failures': { name: 'Security Logging Failures', category: 'Logging', severity: 'medium' },
              'A10:2021 – Server-Side Request Forgery': { name: 'Server-Side Request Forgery', category: 'SSRF', severity: 'high' },
            };
            const owaspArr = analyticsData.owasp_top10_summary
              .map((item: any) => {
                const categoryInfo = owaspCategoryMap[item.category] || {
                  name: item.category,
                  category: item.category.split(':')[0] || item.category,
                  severity: 'medium' as const,
                };
                return { name: categoryInfo.name, category: categoryInfo.category, count: Number(item.threat_count || 0), severity: categoryInfo.severity } as OWASPThreat;
              })
              .filter((item: OWASPThreat) => item.count > 0)
              .sort((a, b) => b.count - a.count);

            const allOwaspItems: OWASPThreat[] = [
              { name: 'Broken Access Control', category: 'Access Control', count: 0, severity: 'critical' },
              { name: 'Cryptographic Failures', category: 'Cryptography', count: 0, severity: 'high' },
              { name: 'Injection', category: 'Injection', count: 0, severity: 'critical' },
              { name: 'Insecure Design', category: 'Design', count: 0, severity: 'high' },
              { name: 'Security Misconfiguration', category: 'Configuration', count: 0, severity: 'medium' },
              { name: 'Vulnerable Components', category: 'Components', count: 0, severity: 'high' },
              { name: 'Authentication Failures', category: 'Authentication', count: 0, severity: 'critical' },
              { name: 'Software & Data Integrity', category: 'Integrity', count: 0, severity: 'high' },
              { name: 'Security Logging Failures', category: 'Logging', count: 0, severity: 'medium' },
              { name: 'Server-Side Request Forgery', category: 'SSRF', count: 0, severity: 'high' },
            ];
            setOwaspThreats(allOwaspItems.map((defaultItem) => {
              const apiItem = owaspArr.find((item) => item.name === defaultItem.name);
              return apiItem || defaultItem;
            }));
          }
        }
      })
      .catch(() => {
        setTrafficData([]);
        setThreatTypes([]);
        setThreatTypesByCategory([]);
        setCountryData([]);
      });

    apiService.getPlatformRequestLogs(id, { num: '10' })
      .then((logs: any) => {
        let logsArray = [];
        if (logs && logs.results && Array.isArray(logs.results)) {
          logsArray = logs.results;
        } else if (Array.isArray(logs)) {
          logsArray = logs;
        } else if (logs?.logs && Array.isArray(logs.logs)) {
          logsArray = logs.logs;
        } else {
          logsArray = [];
        }
        setThreatLogs(logsArray);
      })
      .catch(() => setThreatLogs([]));
  };

  useEffect(() => { fetchData(); }, [id]);
  useEffect(() => { fetchAllRangedData(); }, [id, timeRange]);

  const totalRequests = analytics ? Number(analytics.total_requests ?? 0) : 0;
  const blockedRequests = analytics ? Number(analytics.blocked_requests ?? 0) : 0;
  const successRate = analytics && typeof analytics.success_rate === 'number' ? Number(analytics.success_rate) : 0;
  const blockedRate = totalRequests > 0 ? (blockedRequests / totalRequests) * 100 : 0;
  const activeEndpointCount = Array.isArray(endpoints)
    ? endpoints.filter((e: any) => e.status === 'active' || e.is_active).length
    : 0;

  const trafficOverviewData = HTTP_METHODS.map((method) => {
    const row = trafficData.find((item: any) => item.method === method) || { method };
    const total = Object.entries(row).reduce((sum: number, [key, value]) => {
      if (key === 'method') return sum;
      return sum + Number(value || 0);
    }, 0);
    return { method, total };
  });

  const topThreats = threatTypesByCategory.slice(0, 4);
  const maxThreat = Math.max(...topThreats.map((item: any) => Number(item.value || 0)), 1);
  const activeOwaspThreats = owaspThreats.filter((item) => item.count > 0);

  const recentRows = threatLogs.slice(0, 4).map((log: any) => ({
    id: log.id ?? `${log.path}-${Math.random()}`,
    path: log.path || '-',
    attack: log.waf_rule_triggered || (log.threat_level && log.threat_level !== 'none'
      ? `${String(log.threat_level).toUpperCase()} Threat`
      : log.waf_blocked ? 'Suspicious Request' : 'Clean'),
    source: log.client_ip || '-',
    status: log.waf_blocked ? 'blocked' : Number(log.status_code) >= 400 ? 'warning' : 'allowed',
  }));

  const cardClass = 'bg-white dark:bg-[#0d1829] border border-slate-200/60 dark:border-blue-900/20 rounded-2xl';
  const headerClass = 'border-b border-slate-100 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]';
  const controlClass = 'rounded-lg border border-slate-200 dark:border-blue-900/30 bg-white dark:bg-[#0a1220] px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 dark:focus:border-blue-400 cursor-pointer';
  const metricNumberClass = 'font-mono tabular-nums text-[2.25rem] font-bold leading-none tracking-[-0.04em] text-slate-900 dark:text-white';

  const getStatusClass = (status: string) => {
    if (status === 'blocked') return 'border border-red-200/60 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400';
    if (status === 'allowed') return 'border border-emerald-200/60 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400';
    return 'border border-amber-200/60 bg-amber-50 text-amber-600 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400';
  };

  const getAttackTextClass = (attack: string) => {
    const value = (attack || '').toLowerCase();
    if (value.includes('clean')) return 'text-emerald-600 dark:text-emerald-400';
    if (value.includes('brute') || value.includes('warning')) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-500 dark:text-red-400';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#F2F6FE] dark:bg-[#0F1724]">
        <div className="flex h-64 w-full max-w-sm flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Activity className="h-7 w-7 animate-spin text-white" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Loading Dashboard</p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Fetching security telemetry…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-8 text-center text-red-600 dark:text-red-400">Error: {error}</div>;
  if (!platform) return <div className="p-8 text-center text-slate-900 dark:text-white">Workspace not found.</div>;

  return (
    <div className="w-full min-h-screen bg-[#F2F6FE] dark:bg-[#0F1724] px-5 pb-12 pt-0.1">
      <div className="w-full space-y-5">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[20px] bg-gradient-to-br from-[#1e3a8a] via-[#2563eb] to-[#06b6d4] px-7 py-7 text-white"
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]">
            <div
              className="absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)',
                backgroundSize: '32px 32px',
              }}
            />
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          </div>

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 flex-1">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-white backdrop-blur-sm">
                <Shield className="h-3 w-3" />
                {platform?.name || 'Workspace'}
              </div>
              <h1 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">Security Dashboard</h1>
              <p className="mt-1.5 text-sm text-blue-100/70">Real-time WAF telemetry and threat intelligence</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button variant="outline" onClick={() => navigate('/platforms')} className="rounded-full border-white/30 bg-white/10 px-4 py-2 text-sm text-white font-medium hover:!bg-white/20 hover:!text-white backdrop-blur-sm">
                <Eye className="mr-1.5 h-3.5 w-3.5" />Workspaces
              </Button>
              <Button onClick={() => navigate('/onboarding')} className="rounded-full bg-white px-4 py-2 text-sm text-blue-700 font-semibold hover:bg-white/90">
                <Plus className="mr-1.5 h-3.5 w-3.5" />New
              </Button>
            </div>
          </div>

          <div className="relative mt-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-white">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>Live
            </span>
            <button onClick={() => { setIsAlertClicked(true); navigate('/threat-logs'); }} className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-red-500/30">
              <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400" /><span className="relative inline-flex h-2 w-2 rounded-full bg-red-400" /></span>Alerts
            </button>
            <div className="relative group">
              <span className="inline-flex cursor-default items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition-all group-hover:bg-white/20 backdrop-blur-sm">
                <Activity className="h-3.5 w-3.5" />AI analysing
              </span>
              <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 w-64 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                <div className="relative rounded-2xl border border-white/10 bg-[#0f172a]/95 p-4 text-left shadow-2xl backdrop-blur-md">
                  <div className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-sm border-b border-r border-white/10 bg-[#0f172a]/95" />
                  <div className="mb-2 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
                      <Activity className="h-3.5 w-3.5 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-white">AI Analysing — Coming Soon</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-slate-300">
                    A new AI-powered feature that gives you <span className="font-semibold text-cyan-400">real-time threat analysis</span>, live traffic insights, and intelligent security recommendations — all automatically.
                  </p>
                  <div className="mt-2.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                    <span className="text-[10px] font-medium text-cyan-400">Actively being developed</span>
                  </div>
                </div>
              </div>
            </div>
            <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white lg:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />Updated just now
            </span>
          </div>
        </motion.div>

        {/* MAIN GRID */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">

          {/* Traffic Overview */}
          <Card className={`${cardClass} overflow-hidden`}>
            <CardHeader className={`flex flex-row items-start justify-between space-y-0 p-6 pb-4 ${headerClass}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 ring-1 ring-blue-100 dark:ring-blue-500/20">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Traffic Overview</CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Request changes and protection metrics</CardDescription>
                </div>
              </div>
              <select className={controlClass} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                {TIME_RANGES.map((range) => (<option key={range.value} value={range.value}>{range.label}</option>))}
              </select>
            </CardHeader>
            <CardContent className="p-6 pt-5">
              <div className="mb-6 grid grid-cols-3 gap-4 rounded-xl border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 p-4">
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Total</div>
                  <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{totalRequests.toLocaleString()}</div>
                  {totalRequests > 0 && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                      <Activity className="h-2.5 w-2.5" />Active
                    </div>
                  )}
                </div>
                <div className="border-l border-slate-200/80 dark:border-blue-900/20 pl-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Blocked</div>
                  <div className="text-2xl font-bold tabular-nums tracking-tight text-red-500 dark:text-red-400">{blockedRequests.toLocaleString()}</div>
                </div>
                <div className="border-l border-slate-200/80 dark:border-blue-900/20 pl-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">Block rate</div>
                  <div className="text-2xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{totalRequests > 0 ? `${blockedRate.toFixed(1)}%` : '0.0%'}</div>
                </div>
              </div>
              <div className="h-56 w-full">
                {trafficOverviewData.length > 0 && trafficOverviewData.some((item) => item.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficOverviewData}>
                      <defs>
                        <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
                      <XAxis dataKey="method" tick={{ fontSize: 11, fill: '#94a3b8', fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip contentStyle={{ background: '#0d1829', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px', fontSize: '12px', color: '#e2e8f0' }} cursor={{ stroke: 'rgba(37,99,235,0.3)', strokeWidth: 1 }} />
                      <Area type="monotone" dataKey="total" stroke="#2563EB" fill="url(#trafficGradient)" strokeWidth={2.5} dot={false} isAnimationActive={true} animationDuration={1000} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                    <div className="text-center">
                      <Activity className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" />
                      <p className="text-sm text-slate-400 dark:text-slate-500">No traffic data for this period</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-5">

            {/* Top Threats */}
            <Card className={`${cardClass} overflow-hidden`}>
              <CardHeader className={`flex flex-row items-start justify-between space-y-0 p-5 pb-4 ${headerClass}`}>
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Top Threats</CardTitle>
                  <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Highest-volume attack patterns</CardDescription>
                </div>
                <button onClick={() => navigate('/threat-logs')} className="rounded-md bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">view_all</button>
              </CardHeader>
              <CardContent className="p-5 pt-4">
                {topThreats.length > 0 ? (
                  (() => {
                    const threat = topThreats[0];
                    const getThreatCode = (name: string) => {
                      const words = (name || '').split(' ');
                      if (words.length === 1) return (words[0] || '').slice(0, 3).toUpperCase();
                      return words.map((word) => word[0]).join('').slice(0, 3).toUpperCase();
                    };
                    const getThreatBadgeClass = (name: string) => {
                      const value = (name || '').toLowerCase();
                      if (value.includes('sql')) return 'border border-red-200/60 bg-red-50 text-red-500 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400';
                      if (value.includes('xss') || value.includes('script')) return 'border border-amber-200/60 bg-amber-50 text-amber-500 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400';
                      if (value.includes('brute') || value.includes('auth') || value.includes('rate')) return 'border border-blue-200/60 bg-blue-50 text-blue-600 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400';
                      return 'border border-cyan-200/60 bg-cyan-50 text-cyan-600 dark:border-cyan-500/20 dark:bg-cyan-500/10 dark:text-cyan-400';
                    };
                    const threatCode = getThreatCode(threat.name);
                    const threatBadgeClass = getThreatBadgeClass(threat.name);
                    const threatValue = Number(threat.value || 0);
                    const progressWidth = threatValue > 0 ? 100 : 0;
                    return (
                      <div className="flex items-center gap-3 rounded-xl border border-slate-100 dark:border-blue-900/20 bg-slate-50/50 dark:bg-[#0F1724]/50 p-3">
                        <span className={`flex-shrink-0 rounded-lg px-2 py-1 font-mono text-[10px] font-bold ${threatBadgeClass}`}>{threatCode}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700 dark:text-slate-200">{threat.name}</span>
                        <div className="h-1.5 w-14 flex-shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.min(progressWidth, 100)}%`, backgroundColor: threat.color || '#9ca3af' }} />
                        </div>
                        <span className="w-8 flex-shrink-0 text-right font-mono tabular-nums text-xs font-bold text-slate-500 dark:text-slate-400">{threatValue}</span>
                      </div>
                    );
                  })()
                ) : (
                  <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                    <div className="text-center">
                      <Shield className="mx-auto mb-1 h-6 w-6 text-slate-300 dark:text-slate-700" />
                      <p className="text-xs text-slate-400 dark:text-slate-500">No threat data available</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* ── Team Members ─────────────────────────────────────────────── */}
            <Card className={`${cardClass} overflow-hidden`}>
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 p-5 pb-4 ${headerClass}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-100 dark:ring-indigo-500/20">
                    <Users className="h-4.5 w-4.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Team Members</CardTitle>
                    <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                      {platformMembers.length > 0
                        ? `${platformMembers.length} member${platformMembers.length !== 1 ? 's' : ''}`
                        : 'Access & permissions'}
                    </CardDescription>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/users')}
                  className="rounded-md bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                >
                  view_all
                </button>
              </CardHeader>

              <CardContent className="p-5 pt-4">
                {membersLoading ? (
                  <div className="flex h-36 items-center justify-center">
                    <Activity className="h-5 w-5 animate-spin text-blue-500" />
                  </div>
                ) : platformMembers.length === 0 ? (
                  <div className="flex h-36 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                    <Users className="h-7 w-7 text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="text-xs text-slate-400 dark:text-slate-500">No team members yet</p>
                    <Button variant="link" className="mt-1 text-xs text-blue-600 dark:text-blue-400 h-auto p-0" onClick={() => navigate('/users')}>
                      Invite users →
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {platformMembers.slice(0, 5).map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50 px-3 py-2.5 transition-colors hover:border-blue-200 dark:hover:border-blue-800/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* ── Deterministic gradient avatar ── */}
                          <MemberAvatar
                            email={member.user_email}
                            size={28}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                              {member.user_name || member.user_email}
                            </p>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                              {member.user_email}
                            </p>
                          </div>
                        </div>
                        <Badge
                          className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            member.is_owner
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border-0'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-0'
                          }`}
                        >
                          {member.is_owner ? 'Owner' : member.role || 'Member'}
                        </Badge>
                      </div>
                    ))}
                    {platformMembers.length > 5 && (
                      <button onClick={() => navigate('/users')} className="w-full text-center text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1">
                        +{platformMembers.length - 5} more members
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* METRIC CARDS */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b from-blue-600 to-cyan-500" />
            <CardContent className="p-6 pl-7">
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">total_requests</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10"><Activity className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /></div>
              </div>
              <AnimatedNumber value={totalRequests} className={metricNumberClass} />
              <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">{totalRequests > 0 ? 'Requests received' : 'No traffic yet'}</p>
              <div className="mt-4 h-1 rounded-full bg-blue-50 dark:bg-slate-800/80">
                <div className="h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-700" style={{ width: totalRequests > 0 ? '100%' : '0%' }} />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b from-red-500 to-rose-600" />
            <CardContent className="p-6 pl-7">
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">threats_blocked</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 dark:bg-red-500/10"><Shield className="h-3.5 w-3.5 text-red-500 dark:text-red-400" /></div>
              </div>
              <AnimatedNumber value={blockedRequests} className={metricNumberClass} />
              <p className="mt-2 text-xs font-medium text-slate-400 dark:text-slate-500">{blockedRequests > 0 ? 'Threats mitigated' : 'No threats blocked'}</p>
              <div className="mt-4 h-1 rounded-full bg-red-50 dark:bg-slate-800/80">
                <div className="h-1 rounded-full bg-gradient-to-r from-red-500 to-rose-600 transition-all duration-700" style={{ width: `${totalRequests > 0 ? Math.min(100, (blockedRequests / totalRequests) * 100) : 0}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b from-cyan-500 to-teal-500" />
            <CardContent className="p-6 pl-7">
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">blocked_rate</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-500/10"><AlertTriangle className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" /></div>
              </div>
              <AnimatedNumber value={blockedRate} decimals={2} suffix="%" className={metricNumberClass} />
              <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300"><AnimatedNumber value={successRate} decimals={2} suffix="% success rate" /></p>
              <div className="mt-4 h-1 rounded-full bg-cyan-50 dark:bg-slate-800/80">
                <div className="h-1 rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-700" style={{ width: `${Math.min(100, Math.max(0, blockedRate ?? 0))}%` }} />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829]">
            <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl bg-gradient-to-b from-emerald-500 to-green-600" />
            <CardContent className="p-6 pl-7">
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">active_endpoints</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-500/10"><Globe className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /></div>
              </div>
              <AnimatedNumber value={activeEndpointCount} className={metricNumberClass} />
              <p className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{activeEndpointCount > 0 ? 'Monitoring active' : 'No endpoints yet'}</p>
              <div className="mt-4 h-1 rounded-full bg-emerald-50 dark:bg-slate-800/80">
                <div className="h-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 transition-all duration-700" style={{ width: activeEndpointCount > 0 ? '100%' : '0%' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* THREAT EVENTS TABLE */}
        <Card className={`${cardClass} overflow-hidden`}>
          <CardHeader className={`flex flex-row items-center justify-between space-y-0 p-6 pb-4 ${headerClass}`}>
            <div>
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Recent Threat Events</CardTitle>
              <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Real-time security events log</CardDescription>
            </div>
            <button onClick={() => navigate('/threat-logs')} className="rounded-md bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors">view_logs()</button>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {recentRows.length > 0 ? (
              <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-blue-900/20">
                <div className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] gap-3 border-b border-slate-100 dark:border-blue-900/20 bg-slate-50/80 dark:bg-[#0F1724]/60 px-5 py-3">
                  {['Endpoint', 'Attack Type', 'Source IP', 'Status'].map((h) => (
                    <span key={h} className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">{h}</span>
                  ))}
                </div>
                <div className="divide-y divide-slate-50 dark:divide-blue-900/10">
                  {recentRows.map((row) => (
                    <div key={row.id} className="grid grid-cols-[2fr_1.4fr_1.2fr_1fr] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/80 dark:hover:bg-blue-900/5">
                      <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{row.path}</span>
                      <span className={`text-xs font-semibold ${getAttackTextClass(row.attack)}`}>{row.attack}</span>
                      <span className="font-mono text-xs text-slate-400 dark:text-slate-500">{row.source}</span>
                      <span className={`inline-flex w-fit items-center rounded-lg px-2.5 py-1 text-[10px] font-bold ${getStatusClass(row.status)}`}>
                        {row.status === 'blocked' ? 'Blocked' : row.status === 'allowed' ? 'Allowed' : 'Warning'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                <div className="text-center">
                  <Shield className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">No threat events recorded yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* LIVE THREAT ACTIVITY */}
        <Card className={`${cardClass} overflow-hidden`}>
          <CardHeader className={`flex flex-row items-start justify-between space-y-0 p-6 pb-4 ${headerClass}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/10 ring-1 ring-amber-100 dark:ring-amber-500/20">
                <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Live Threat Activity</CardTitle>
                <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Real-time API requests and security events</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            {threatLogs && threatLogs.length > 0 ? (
              <div className="space-y-2">
                {threatLogs.slice(0, 8).map((log: any, idx: number) => {
                  const isBlocked = log.waf_blocked;
                  const threatLevel = log.threat_level || 'none';
                  const statusColor = isBlocked ? 'text-red-600 dark:text-red-400' : threatLevel !== 'none' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400';
                  return (
                    <div key={log.id || idx} className={`flex items-center justify-between rounded-xl border px-4 py-3 transition-colors ${isBlocked ? 'border-red-100 dark:border-red-500/15 bg-red-50/60 dark:bg-red-500/5' : threatLevel !== 'none' ? 'border-amber-100 dark:border-amber-500/15 bg-amber-50/60 dark:bg-amber-500/5' : 'border-emerald-100 dark:border-emerald-500/15 bg-emerald-50/60 dark:bg-emerald-500/5'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded px-1.5 py-0.5">{log.method || 'GET'}</span>
                          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400 truncate">{log.path || '/api/endpoint'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px]">
                          <span className="text-slate-400 dark:text-slate-500 font-mono">{log.client_ip || 'Unknown IP'}</span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span className={`font-semibold ${statusColor}`}>{isBlocked ? 'Blocked' : threatLevel !== 'none' ? `${threatLevel.toUpperCase()} Threat` : 'Clean'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 ml-4 flex-shrink-0">
                        <span className="font-mono text-[11px] font-semibold text-slate-400 dark:text-slate-500">{log.status_code || '200'}</span>
                        <div className={`h-2 w-2 rounded-full ${isBlocked ? 'bg-red-500' : threatLevel !== 'none' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                <div className="text-center">
                  <AlertTriangle className="mx-auto mb-2 h-7 w-7 text-slate-300 dark:text-slate-700" />
                  <p className="text-xs text-slate-400 dark:text-slate-500">No live activity yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CHARTS 3-col */}
        <div className="grid gap-5 xl:grid-cols-3">
          <Card className={`${cardClass} overflow-hidden`}>
            <CardHeader className={`flex flex-row items-start justify-between space-y-0 p-5 pb-4 ${headerClass}`}>
              <div>
                <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Response Codes</CardTitle>
                <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Distribution of HTTP response codes</CardDescription>
              </div>
              <select className={controlClass} value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                {TIME_RANGES.map((range) => (<option key={range.value} value={range.value}>{range.label}</option>))}
              </select>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {threatTypes.length > 0 ? (
                <div className="space-y-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={threatTypes} dataKey="value" innerRadius={45} outerRadius={72} paddingAngle={3} isAnimationActive={true} animationDuration={800}>
                        {threatTypes.map((entry: any, index: number) => (<Cell key={`resp-${index}`} fill={entry.color} />))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#0d1829', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px', fontSize: '11px', color: '#e2e8f0' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {threatTypes.slice(0, 4).map((item: any) => (
                      <div key={item.name} className="flex items-center justify-between rounded-lg px-3 py-2 border border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50">
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">{item.name}</span>
                        </div>
                        <span className="font-mono tabular-nums text-[11px] font-bold text-slate-500 dark:text-slate-400">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                  <div className="text-center"><Activity className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" /><p className="text-xs text-slate-400 dark:text-slate-500">No data available</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${cardClass} overflow-hidden`}>
            <CardHeader className={`p-5 pb-4 ${headerClass}`}>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">Requests by Country</CardTitle>
              <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Geographic distribution of traffic</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 p-5 pt-4">
              {countryData.length > 0 ? (
                countryData.slice(0, 5).map((country) => (
                  <div key={country.code} className={`rounded-xl border px-3 py-3 transition-all cursor-default ${hoveredCountry === country.code ? 'border-blue-300 dark:border-blue-500/40 bg-blue-50/60 dark:bg-blue-500/5' : 'border-slate-100 dark:border-blue-900/20 bg-slate-50/60 dark:bg-[#0F1724]/50'}`} onMouseEnter={() => setHoveredCountry(country.code)} onMouseLeave={() => setHoveredCountry(null)}>
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 rounded px-1.5 py-0.5">{country.code}</span>
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{country.name}</span>
                      </div>
                      <span className="font-mono tabular-nums text-[11px] font-bold text-slate-500 dark:text-slate-400">{country.count.toLocaleString()}</span>
                    </div>
                    <div className="h-1 rounded-full bg-slate-100 dark:bg-slate-800/80">
                      <div className="h-1 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500" style={{ width: `${(country.count / Math.max(...countryData.map((item) => item.count), 1)) * 100}%` }} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                  <div className="text-center"><Globe className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" /><p className="text-xs text-slate-400 dark:text-slate-500">No data available</p></div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className={`${cardClass} overflow-hidden`}>
            <CardHeader className={`p-5 pb-4 ${headerClass}`}>
              <CardTitle className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">OWASP Top 10</CardTitle>
              <CardDescription className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">Detected risks by category</CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-4">
              {activeOwaspThreats.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={activeOwaspThreats}>
                    <defs>
                      <linearGradient id="owaspFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                    <XAxis dataKey="name" hide />
                    <YAxis hide />
                    <Tooltip contentStyle={{ background: '#0d1829', border: '1px solid rgba(37,99,235,0.2)', borderRadius: '10px', fontSize: '11px', color: '#e2e8f0' }} />
                    <Area type="monotone" dataKey="count" stroke="#2563EB" fill="url(#owaspFill)" strokeWidth={2.5} dot={false} isAnimationActive={true} animationDuration={800} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-56 items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-blue-900/20">
                  <div className="text-center"><Shield className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-slate-700" /><p className="text-xs text-slate-400 dark:text-slate-500">No OWASP threats detected</p></div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ACTION TILES */}
        <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: 'Security Hub', description: 'Triage security logs and alerts', icon: <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />, url: '/security-hub' },
            { title: 'Threat Logs', description: 'Review detailed security events', icon: <AlertTriangle className="h-5 w-5 text-amber-500 dark:text-amber-400" />, url: '/threat-logs' },
            { title: 'API Endpoints', description: 'Manage and monitor API endpoints', icon: <Globe className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />, url: '/api-endpoints' },
            { title: 'WAF Rules', description: 'Configure security rules and policies', icon: <Shield className="h-5 w-5 text-red-500 dark:text-red-400" />, url: '/waf-rules' },
            { title: 'User Management', description: 'Manage team access and permissions', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4Z" fill="#22c55e" /></svg>, url: '/users' },
            { title: 'Audit Logs', description: 'View system activity and changes', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M17 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2Zm0 16H7V5h10v14Zm-5-2a1 1 0 1 1 0-2 1 1 0 0 1 0 2Zm1-4h-2V7h2v6Z" fill="#a78bfa" /></svg>, url: '/audit-logs' },
            { title: 'IP Blacklist', description: 'Manage blocked IP addresses', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59Z" fill="#ef4444" /></svg>, url: '/ip-blacklist' },
            { title: 'Security Alerts', description: 'Configure and manage security alerts', icon: <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6V11c0-3.07-1.63-5.64-5-6.32V4a1 1 0 1 0-2 0v.68C7.63 5.36 6 7.92 6 11v5l-1.29 1.29A1 1 0 0 0 6 19h12a1 1 0 0 0 .71-1.71L18 16Z" fill="#6366f1" /></svg>, url: '/security-alerts' },
          ].map((action) => (
            <div key={action.title}>
              <Card className="group cursor-pointer rounded-2xl border border-slate-200/60 dark:border-blue-900/20 bg-white dark:bg-[#0d1829] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:hover:border-blue-800/40" onClick={() => navigate(action.url)}>
                <CardContent className="p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 dark:border-blue-900/20 bg-slate-50 dark:bg-[#0F1724]/60 transition-colors group-hover:border-blue-100 dark:group-hover:border-blue-800/30">{action.icon}</div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{action.title}</h3>
                  <p className="mt-1 text-xs text-slate-400 dark:text-slate-500 leading-relaxed">{action.description}</p>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" className="w-full rounded-lg border-slate-200 dark:border-blue-900/30 bg-white dark:bg-[#0d1829] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-700/40 transition-all" onClick={(e) => { e.stopPropagation(); navigate(action.url); }}>Open →</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default PlatformDetails;