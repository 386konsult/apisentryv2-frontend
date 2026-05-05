import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Globe, ChevronDown, Mail, Settings, LogOut, Sun, Moon, Users, Clock, Search, Check, Command, ArrowUp, ArrowDown, CornerDownLeft, X, Home, Shield, AlertTriangle, Bell, Activity, Link, Ban, FlaskConical, FileText, Timer, Briefcase, Send, Zap } from 'lucide-react';
import { usePlatform } from '@/contexts/PlatformContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

// ── Hash ────────────────────────────────────────────────────────────────────
const djb2 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
};

// ── Avatar tokens (unchanged) ───────────────────────────────────────────────
const AVATAR_TOKENS = [
  { from: "#1e3a8a", to: "#06b6d4", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.95" /><circle cx="3" cy="3" r="1.5" fill="white" fillOpacity="0.6" /><circle cx="17" cy="3" r="1.5" fill="white" fillOpacity="0.6" /><circle cx="3" cy="17" r="1.5" fill="white" fillOpacity="0.6" /><circle cx="17" cy="17" r="1.5" fill="white" fillOpacity="0.6" /><line x1="3" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /><line x1="17" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /><line x1="3" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /><line x1="17" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" /></svg>) },
  { from: "#312e81", to: "#6366f1", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3 14 Q6 8 13 5" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" /><path d="M5 16 Q9 11 15 8" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" /><path d="M7 18 Q12 14 17 11" stroke="white" strokeOpacity="0.3" strokeWidth="0.9" strokeLinecap="round" /><circle cx="13.5" cy="4.5" r="2.5" fill="white" fillOpacity="0.9" /><circle cx="13.5" cy="4.5" r="1" fill="white" /></svg>) },
  { from: "#be123c", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 3 C6.5 3 4 5.8 4 9 C4 11.5 5 13.5 6.5 15" stroke="white" strokeOpacity="0.95" strokeWidth="1.4" strokeLinecap="round" /><path d="M10 5.5 C7.5 5.5 6 7.2 6 9 C6 10.5 6.8 11.8 8 13" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 8 C9 8 8.5 8.6 8.5 9.2 C8.5 9.8 9 10.8 9.5 11.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" /><path d="M10 5.5 C12.5 5.5 14 7.2 14 9 C14 11 12.5 13 11 14.5 C13 13.5 16 11 16 9 C16 5.8 13.5 3 10 3" stroke="white" strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round" /></svg>) },
  { from: "#065f46", to: "#14b8a6", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="4" cy="5" r="1.8" fill="white" fillOpacity="0.9" /><circle cx="4" cy="10" r="1.8" fill="white" fillOpacity="0.9" /><circle cx="4" cy="15" r="1.8" fill="white" fillOpacity="0.9" /><circle cx="10" cy="7.5" r="1.8" fill="white" fillOpacity="0.75" /><circle cx="10" cy="12.5" r="1.8" fill="white" fillOpacity="0.75" /><circle cx="16" cy="10" r="1.8" fill="white" fillOpacity="0.9" /><line x1="5.8" y1="5.2" x2="8.2" y2="7.3" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="5.8" y1="10" x2="8.2" y2="7.5" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="5.8" y1="10" x2="8.2" y2="12.5" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="5.8" y1="14.8" x2="8.2" y2="12.7" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="11.8" y1="7.5" x2="14.2" y2="9.8" stroke="white" strokeOpacity="0.5" strokeWidth="1" /><line x1="11.8" y1="12.5" x2="14.2" y2="10.2" stroke="white" strokeOpacity="0.5" strokeWidth="1" /></svg>) },
  { from: "#1e1b4b", to: "#7c3aed", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 2 L16 5 L16 10 C16 13.5 13 16.5 10 18 C7 16.5 4 13.5 4 10 L4 5 Z" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" /><rect x="7.5" y="9" width="5" height="4" rx="1" fill="white" fillOpacity="0.9" /><path d="M8.5 9 L8.5 7.5 C8.5 6.4 11.5 6.4 11.5 7.5 L11.5 9" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" fill="none" /><circle cx="10" cy="11" r="0.8" fill="white" fillOpacity="0.5" /></svg>) },
  { from: "#92400e", to: "#fbbf24", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><ellipse cx="10" cy="5.5" rx="6" ry="2" fill="white" fillOpacity="0.9" /><path d="M4 5.5 L4 10 C4 11.1 6.7 12 10 12 C13.3 12 16 11.1 16 10 L16 5.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" /><path d="M4 10 L4 14.5 C4 15.6 6.7 16.5 10 16.5 C13.3 16.5 16 15.6 16 14.5 L16 10" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" /></svg>) },
  { from: "#0f172a", to: "#22c55e", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="2.5" y="4" width="15" height="12" rx="2.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.8" strokeWidth="1.2" /><path d="M5.5 8 L8 10 L5.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /><line x1="9.5" y1="12" x2="14" y2="12" stroke="white" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" /></svg>) },
  { from: "#0c4a6e", to: "#38bdf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><polyline points="2,10 4,10 5,6 6,14 7.5,8 9,13 10.5,7 12,13 13.5,9 15,11 16,10 18,10" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>) },
  { from: "#4338ca", to: "#ec4899", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><polygon points="10,2 13.5,4 13.5,8 10,10 6.5,8 6.5,4" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" /><polygon points="10,10 13.5,12 13.5,16 10,18 6.5,16 6.5,12" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.55" strokeWidth="1" /><circle cx="10" cy="6" r="1.5" fill="white" fillOpacity="0.9" /></svg>) },
  { from: "#075985", to: "#7dd3fc", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M5.5 14 C3.5 14 2 12.5 2 10.5 C2 8.8 3.2 7.4 4.9 7.1 C4.7 6.7 4.5 6.2 4.5 5.5 C4.5 3.6 6.1 2 8 2 C9.4 2 10.6 2.8 11.2 4 C11.5 3.9 11.8 3.8 12.2 3.8 C14.1 3.8 15.6 5.3 15.6 7.2 C15.6 7.3 15.6 7.4 15.6 7.5 C16.9 7.9 18 9 18 10.5 C18 12.5 16.4 14 14.5 14" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" fill="none" /><path d="M10 17 L10 10" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" /><path d="M7.5 12 L10 9.5 L12.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>) },
  { from: "#5b21b6", to: "#d946ef", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M7 2 C7 5 13 6 13 10 C13 14 7 15 7 18" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none" /><path d="M13 2 C13 5 7 6 7 10 C7 14 13 15 13 18" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" fill="none" /><line x1="7.5" y1="5.5" x2="12.5" y2="5.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="8.5" y1="10" x2="11.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="7.5" y1="14.5" x2="12.5" y2="14.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /></svg>) },
  { from: "#064e3b", to: "#10b981", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><text x="2" y="8" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text><text x="10" y="8" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="2" y="13" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text><text x="10" y="13" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text><text x="2" y="18" fontSize="5" fill="white" fillOpacity="0.3" fontFamily="monospace" fontWeight="bold">11</text><text x="10" y="18" fontSize="5" fill="white" fillOpacity="0.6" fontFamily="monospace" fontWeight="bold">00</text></svg>) },
  { from: "#1e293b", to: "#f97316", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="3" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" /><circle cx="10" cy="10" r="1.2" fill="white" fillOpacity="0.9" /><path d="M10 2.5 L10 4.5 M10 15.5 L10 17.5 M2.5 10 L4.5 10 M15.5 10 L17.5 10 M4.4 4.4 L5.8 5.8 M14.2 14.2 L15.6 15.6 M15.6 4.4 L14.2 5.8 M5.8 14.2 L4.4 15.6" stroke="white" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" /></svg>) },
  { from: "#1d4ed8", to: "#f472b6", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="2" y="14" width="3" height="4" rx="1" fill="white" fillOpacity="0.5" /><rect x="6.5" y="11" width="3" height="7" rx="1" fill="white" fillOpacity="0.7" /><rect x="11" y="7.5" width="3" height="10.5" rx="1" fill="white" fillOpacity="0.85" /><rect x="15.5" y="4" width="3" height="14" rx="1" fill="white" fillOpacity="0.95" /></svg>) },
  { from: "#0f766e", to: "#a7f3d0", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none" /><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" transform="rotate(60 10 10)" /><ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" transform="rotate(120 10 10)" /><circle cx="10" cy="10" r="1.8" fill="white" fillOpacity="0.95" /></svg>) },
  { from: "#1a2e05", to: "#84cc16", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none" /><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1" fill="none" /><circle cx="10" cy="10" r="2.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none" /><line x1="10" y1="10" x2="10" y2="2.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" /><line x1="10" y1="10" x2="16.5" y2="6.5" stroke="white" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" /><circle cx="14.5" cy="5.5" r="1.2" fill="white" fillOpacity="0.9" /></svg>) },
  { from: "#713f12", to: "#facc15", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M11.5 2 L5.5 11.5 L9.5 11.5 L8.5 18 L14.5 8.5 L10.5 8.5 Z" fill="white" fillOpacity="0.95" /></svg>) },
  { from: "#0f2744", to: "#22d3ee", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none" /><ellipse cx="10" cy="10" rx="4" ry="7.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none" /><line x1="2.5" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1" /><path d="M3.5 6.5 Q10 5 16.5 6.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.9" fill="none" /><path d="M3.5 13.5 Q10 15 16.5 13.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.9" fill="none" /></svg>) },
  { from: "#18181b", to: "#818cf8", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" /><rect x="3" y="3" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" /><rect x="13" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" /><rect x="14" y="3" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" /><rect x="2" y="13" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" /><rect x="3" y="14" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" /><rect x="9" y="2" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" /><rect x="9" y="5.5" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" /><rect x="13" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" /><rect x="9" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.9" /><rect x="16" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" /><rect x="9" y="13" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.6" /><rect x="13" y="13" width="5" height="2" rx="0.5" fill="white" fillOpacity="0.4" /><rect x="13" y="16" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" /><rect x="16" y="16" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.4" /></svg>) },
  { from: "#7f1d1d", to: "#fb923c", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M10 2 C10 2 14 5 14 10 L12.5 13 L7.5 13 L6 10 C6 5 10 2 10 2 Z" fill="white" fillOpacity="0.9" /><path d="M7.5 13 L6 16 L8 15 Z" fill="white" fillOpacity="0.6" /><path d="M12.5 13 L14 16 L12 15 Z" fill="white" fillOpacity="0.6" /><circle cx="10" cy="8.5" r="1.8" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.6" strokeWidth="1" /></svg>) },
  { from: "#1d4ed8", to: "#a855f7", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M3.5 10 C3.5 7.5 5.2 5.5 7.5 5.5 C9 5.5 10 6.5 10 6.5 C10 6.5 11 5.5 12.5 5.5 C14.8 5.5 16.5 7.5 16.5 10 C16.5 12.5 14.8 14.5 12.5 14.5 C11 14.5 10 13.5 10 13.5 C10 13.5 9 14.5 7.5 14.5 C5.2 14.5 3.5 12.5 3.5 10 Z" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" fill="none" /><circle cx="7.5" cy="10" r="1.3" fill="white" fillOpacity="0.9" /><circle cx="12.5" cy="10" r="1.3" fill="white" fillOpacity="0.5" /></svg>) },
  { from: "#134e4a", to: "#86efac", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><rect x="2.5" y="3" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" /><rect x="2.5" y="8" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.65" strokeWidth="1.2" /><rect x="2.5" y="13" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" /><circle cx="14.5" cy="5" r="1" fill="white" fillOpacity="0.9" /><circle cx="14.5" cy="10" r="1" fill="white" fillOpacity="0.6" /><circle cx="14.5" cy="15" r="1" fill="white" fillOpacity="0.35" /></svg>) },
  { from: "#0f172a", to: "#60a5fa", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><path d="M7 7 L7 5 C7 3.9 7.9 3 9 3 C10.1 3 11 3.9 11 5 L11 7 L13 7 L13 5 C13 3.9 13.9 3 15 3 C16.1 3 17 3.9 17 5 C17 6.1 16.1 7 15 7 L13 7 L13 9 L15 9 C16.1 9 17 9.9 17 11 C17 12.1 16.1 13 15 13 L13 13 L13 15 C13 16.1 12.1 17 11 17 C9.9 17 9 16.1 9 15 L9 13 L7 13 L7 15 C7 16.1 6.1 17 5 17 C3.9 17 3 16.1 3 15 C3 13.9 3.9 13 5 13 L7 13 L7 11 L5 11 C3.9 11 3 10.1 3 9 C3 7.9 3.9 7 5 7 L7 7 Z M9 7 L9 9 L11 9 L11 7 Z M9 11 L9 13 L11 13 L11 11 Z" fill="white" fillOpacity="0.9" /></svg>) },
  { from: "#831843", to: "#fb7185", svg: (<svg viewBox="0 0 20 20" fill="none" width="18" height="18"><circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none" /><circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" /><circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9" /><line x1="10" y1="2.5" x2="10" y2="5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="10" y1="15" x2="10" y2="17.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="2.5" y1="10" x2="5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /><line x1="15" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" /></svg>) },
];

// ── Presence ─────────────────────────────────────────────────────────────────
const IDLE_MS = 3 * 60 * 1000;
const STATUS_STORAGE_KEY = 'heimdall_user_status';
const getRecentSearchesKey = (userId?: number) => {
  return userId ? `heimdall_recent_searches_${userId}` : 'heimdall_recent_searches_anonymous';
};

function usePresenceStatus() {
  const [isActive, setIsActive] = useState(true);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => { setIsActive(true); clearTimeout(timer); timer = setTimeout(() => setIsActive(false), IDLE_MS); };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    const onVis = () => { if (document.visibilityState === 'hidden') { clearTimeout(timer); setIsActive(false); } else reset(); };
    document.addEventListener('visibilitychange', onVis);
    reset();
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); document.removeEventListener('visibilitychange', onVis); };
  }, []);
  return isActive;
}

// ── Avatar ───────────────────────────────────────────────────────────────────
const UserAvatar = ({ email, size = "sm", isActive = true }: { email: string; size?: "sm" | "md"; isActive?: boolean }) => {
  const token = AVATAR_TOKENS[djb2(email || "user@heimdall") % AVATAR_TOKENS.length];
  const dim = size === "sm" ? 28 : 36;
  return (
    <div style={{ width: dim, height: dim, borderRadius: "50%", flexShrink: 0, background: `linear-gradient(135deg, ${token.from}, ${token.to})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 0 1.5px ${token.to}30, 0 1px 4px ${token.from}55`, position: "relative" }}>
      {token.svg}
      <span style={{ position: "absolute", bottom: -1, right: -1, width: 8, height: 8, borderRadius: "50%", background: isActive ? "#22c55e" : "#eab308", border: "1.5px solid white", transition: "background 0.6s ease" }} />
    </div>
  );
};

// ── Helper to resolve dynamic paths (e.g., workspace/:id/rate-limiting) ─────
const resolvePath = (path: string): string => {
  if (path.includes(':id')) {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) {
      console.warn('No platform selected for dynamic path');
      return '/platforms';
    }
    return path.replace(':id', platformId);
  }
  return path;
};

// ── Page index — comprehensive with Lucide icons ────────────────────────────
const PAGE_INDEX = [
  { label: 'Dashboard', path: '/platforms', keywords: ['dashboard', 'home', 'overview', 'main', 'start'], icon: Home },
  { label: 'Security Hub', path: '/security-hub', keywords: ['security', 'hub', 'triage', 'center'], icon: Shield },
  { label: 'Threat Logs', path: '/threat-logs', keywords: ['threat', 'log', 'logs', 'attack', 'attacks', 'waf', 'blocked', 'malicious'], icon: AlertTriangle },
  { label: 'Security Alerts', path: '/security-alerts', keywords: ['alert', 'alerts', 'notification', 'notifications', 'warning'], icon: Bell },
  { label: 'Incidents', path: '/incidents', keywords: ['incident', 'incidents', 'event', 'events', 'response', 'breach'], icon: Activity },
  { label: 'API Endpoints', path: '/api-endpoints', keywords: ['api', 'endpoint', 'endpoints', 'route', 'routes', 'url'], icon: Link },
  { label: 'IP Blacklist', path: '/ip-blacklist', keywords: ['ip', 'blacklist', 'block', 'ban', 'blocked', 'address', 'deny'], icon: Ban },
  { label: 'Playground', path: '/playground', keywords: ['playground', 'test', 'try', 'simulate', 'demo', 'sandbox'], icon: FlaskConical },
  { label: 'CISO Reports', path: '/ciso-reports', keywords: ['ciso', 'report', 'reports', 'executive', 'compliance', 'summary'], icon: FileText },
  { label: 'Rate Limiting', path: '/workspace/:id/rate-limiting', keywords: ['rate', 'limit', 'limiting', 'throttle', 'throttling', 'quota', 'ratelimit', 'rate limit', 'rate-limit'], icon: Timer },
  { label: 'Users & Teams', path: '/users', keywords: ['user', 'users', 'team', 'teams', 'member', 'members', 'people', 'staff', 'account'], icon: Users },
  { label: 'Invitations', path: '/invitations', keywords: ['invitation', 'invitations', 'invite', 'invites', 'join', 'onboard'], icon: Send },
  { label: 'Settings', path: '/settings', keywords: ['setting', 'settings', 'config', 'configuration', 'preferences', 'options', 'setup'], icon: Settings },
  { label: 'Audit Logs', path: '/audit-logs', keywords: ['audit', 'log', 'logs', 'history', 'activity', 'trail', 'changes'], icon: Clock },
  { label: 'Workspaces', path: '/platforms', keywords: ['workspace', 'workspaces', 'platform', 'platforms', 'project', 'space'], icon: Briefcase },
];

// ── Smart search scoring ─────────────────────────────────────────────────────
function scoreResult(item: typeof PAGE_INDEX[0], q: string): number {
  const label = item.label.toLowerCase();
  const words = q.toLowerCase().trim().split(/\s+/);
  let score = 0;
  for (const word of words) {
    if (label === word) score += 100;
    else if (label.startsWith(word)) score += 60;
    else if (label.includes(word)) score += 30;
    else if (item.keywords.some(k => k === word)) score += 50;
    else if (item.keywords.some(k => k.startsWith(word))) score += 35;
    else if (item.keywords.some(k => k.includes(word))) score += 15;
  }
  return score;
}

const PlatformIndicator: React.FC = () => {
  const { hasSelectedPlatform } = usePlatform();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isActivePresence = usePresenceStatus();
  const isOnPlatformsPage = location.pathname === '/platforms';
  const { toast } = useToast();

const [manualStatus, setManualStatus] = useState<'active' | 'away' | null>(null);
const [loadingStatus, setLoadingStatus] = useState(true);

// Fetch status from backend on mount
useEffect(() => {
    const fetchStatus = async () => {
        try {
            const data = await apiService.getUserStatus();
            setManualStatus(data.status as 'active' | 'away');
        } catch (error) {
            console.error('Failed to fetch user status', error);
            setManualStatus('active'); // fallback
        } finally {
            setLoadingStatus(false);
        }
    };
    fetchStatus();
}, []);

const setAndPersistStatus = async (status: 'active' | 'away') => {
    const previous = manualStatus;
    setManualStatus(status); // optimistic update
    try {
        await apiService.updateUserStatus(status);
        toast({
            title: "Status updated",
            description: `Your status is now ${status}.`,
            variant: "default",
        });
    } catch (error) {
        // revert on error
        setManualStatus(previous);
        toast({
            title: "Failed to update status",
            description: "Please try again.",
            variant: "destructive",
        });
    }
};



const effectiveStatus = manualStatus !== null ? manualStatus === 'active' : isActivePresence;

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('heimdall_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('heimdall_theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('heimdall_theme', 'light'); }
  }, [isDark]);

  const [hasPendingInvitations] = useState(true);

  // ── Search state ────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
  const key = getRecentSearchesKey(user?.id);
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
});
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = searchQuery.trim()
    ? PAGE_INDEX
        .map(p => ({ ...p, score: scoreResult(p, searchQuery) }))
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
    : [];

  const showDropdown = searchOpen && (searchQuery.trim() ? searchResults.length > 0 : recentSearches.length > 0);

  const saveRecent = useCallback((label: string) => {
  setRecentSearches(prev => {
    const updated = [label, ...prev.filter(r => r !== label)].slice(0, 5);
    const key = getRecentSearchesKey(user?.id);
    try { localStorage.setItem(key, JSON.stringify(updated)); } catch {}
    return updated;
  });
}, [user?.id]);

  const navigateTo = useCallback((path: string, label: string) => {
    const resolvedPath = resolvePath(path);
    saveRecent(label);
    
    // Check if Rate Limiting and no platform selected
    if (path.includes('rate-limiting') && !localStorage.getItem('selected_platform_id')) {
      toast({
        title: "Select a workspace first",
        description: "Please select a workspace to access Rate Limiting",
        variant: "default",
      });
      navigate('/platforms');
      setSearchOpen(false);
      setSearchQuery('');
      return;
    }
    
    navigate(resolvedPath);
    setSearchQuery('');
    setSearchOpen(false);
    setSelectedIndex(0);
  }, [navigate, saveRecent, toast]);

  // Keyboard navigation
  useEffect(() => {
    if (!searchOpen) return;
    const items = searchQuery.trim() ? searchResults : recentSearches.map(r => PAGE_INDEX.find(p => p.label === r)).filter(Boolean) as typeof PAGE_INDEX;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, items.length - 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[selectedIndex];
        if (item) navigateTo(item.path, item.label);
      }
      else if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen, searchQuery, searchResults, recentSearches, selectedIndex, navigateTo]);

  // Reset selected index on query change
  useEffect(() => { setSelectedIndex(0); }, [searchQuery]);

  // Cmd+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    try { await logout(); navigate('/login'); } catch {}
  };

  const iconBtn = "flex items-center justify-center rounded-full p-1.5 transition-colors";
  const platformBtn = (active: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${active ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950" : "text-orange-500 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950"}`;

  const recentItems = recentSearches.map(r => PAGE_INDEX.find(p => p.label === r)).filter(Boolean) as typeof PAGE_INDEX;
  const dropdownItems = searchQuery.trim() ? searchResults : recentItems;

  return (
    <div className="flex items-center gap-2 w-full">

      {/* ── Global Search with same animation/transparency as user dropdown ── */}
      <div ref={searchRef} className="relative">
        <div
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 w-64 transition-all duration-200 ${
            searchOpen
              ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl ring-2 ring-blue-400/40 shadow-lg'
              : 'bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80'
          }`}
        >
          <Search className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            placeholder="Search pages…"
            className="bg-transparent text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none w-full"
          />
          {searchQuery ? (
            <button onClick={() => { setSearchQuery(''); inputRef.current?.focus(); }} className="flex-shrink-0">
              <X className="h-3 w-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200" />
            </button>
          ) : (
            <kbd className="hidden sm:flex items-center gap-0.5 rounded border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 text-[9px] font-medium text-gray-400 dark:text-gray-500 flex-shrink-0">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          )}
        </div>

        <AnimatePresence>
          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.96 }}
              transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.7 }}
              className="absolute top-full mt-2 left-0 w-72 z-50 rounded-xl border border-white/20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-2xl overflow-hidden"
            >
              {/* Header label */}
              <div className="px-4 pt-3 pb-1.5 flex items-center justify-between border-b border-white/10">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  {searchQuery.trim() ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}` : 'Recent'}
                </span>
                {!searchQuery.trim() && recentSearches.length > 0 && (
                  <button
  onClick={() => {
    setRecentSearches([]);
    const key = getRecentSearchesKey(user?.id);
    localStorage.removeItem(key);
  }}
  className="text-[9px] ..."
>
  Clear
</button>
                )}
              </div>

              {/* Results with Lucide icons */}
              <div className="py-2">
                {dropdownItems.map((item, i) => {
                  const IconComponent = item.icon;
                  return (
                    <motion.button
                      key={item.label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigateTo(item.path, item.label)}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === i
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      }`}
                    >
                      <IconComponent className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">{item.label}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block">{item.path}</span>
                      </div>
                      {selectedIndex === i && (
                        <CornerDownLeft className="h-3 w-3 text-blue-400 flex-shrink-0" />
                      )}
                    </motion.button>
                  );
                })}
              </div>

              {/* Footer hint */}
              <div className="border-t border-white/10 px-4 py-2 flex items-center gap-3">
                <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-600">
                  <ArrowUp className="h-2.5 w-2.5" /><ArrowDown className="h-2.5 w-2.5" /> navigate
                </div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-600">
                  <CornerDownLeft className="h-2.5 w-2.5" /> select
                </div>
                <div className="flex items-center gap-1 text-[9px] text-gray-400 dark:text-gray-600">
                  esc close
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1" />

      {/* ── Invitations ────────────────────────────────────────────────────── */}
      <button onClick={() => navigate('/invitations')} className={`${iconBtn} text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950`} title="Invitations">
        <div className="relative">
          <Mail className="h-5 w-5" />
          {hasPendingInvitations && <span className="absolute -bottom-1 -right-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />}
        </div>
      </button>

      {/* ── Theme toggle ───────────────────────────────────────────────────── */}
      <button onClick={() => setIsDark(p => !p)} className={`${iconBtn} text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950`} title={isDark ? "Switch to light" : "Switch to dark"}>
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* ── Workspace selector ─────────────────────────────────────────────── */}
      <button onClick={() => navigate('/platforms')} className={platformBtn(isOnPlatformsPage || !hasSelectedPlatform)}>
        <Globe className="h-4 w-4" />
        {isOnPlatformsPage || !hasSelectedPlatform ? 'Select Workspace' : 'Workspace Selected'}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {/* ── Account dropdown ───────────────────────────────────────────────── */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className={`${iconBtn} hover:bg-gray-100 dark:hover:bg-gray-800`}>
            <UserAvatar email={user?.email || ""} size="sm" isActive={effectiveStatus} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-52 rounded-[20px] border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl p-1">
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.7 }}>

            <DropdownMenuLabel>
              <div className="flex items-center gap-2.5 px-1 py-1">
                <UserAvatar email={user?.email || ""} size="sm" isActive={effectiveStatus} />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 dark:text-white truncate">
                    {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email?.split('@')[0] || 'User'}
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</div>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />

            <div className="px-2 py-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1 px-1">Status</p>
              <button onClick={() => setAndPersistStatus('active')} className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 5px #22c55e88' }} />
                  <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Active</span>
                </div>
                {effectiveStatus && <Check className="h-3 w-3 text-emerald-500" />}
              </button>
              <button onClick={() => setAndPersistStatus('away')} className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors">
                <div className="flex items-center gap-2">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#eab308', display: 'inline-block', boxShadow: '0 0 5px #eab30888' }} />
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400">Away</span>
                </div>
                {!effectiveStatus && <Check className="h-3 w-3 text-amber-500" />}
              </button>
            </div>

            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />

            <DropdownMenuItem onClick={() => navigate('/users')} className="rounded-2xl mx-1"><Users className="mr-2 h-4 w-4" /><span>Users & Teams</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/audit-logs')} className="rounded-2xl mx-1"><Clock className="mr-2 h-4 w-4" /><span>Audit Logs</span></DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-2xl mx-1"><Settings className="mr-2 h-4 w-4" /><span>Settings</span></DropdownMenuItem>

            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />

            <DropdownMenuItem onClick={handleLogout} className="rounded-2xl mx-1 text-red-500 dark:text-red-400 focus:text-red-500">
              <LogOut className="mr-2 h-4 w-4" /><span>Log out</span>
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PlatformIndicator;