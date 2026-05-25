import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Globe, ChevronDown, Mail, Settings, LogOut, Sun, Moon, Users, Clock,
  Search, Check, Command, ArrowUp, ArrowDown, CornerDownLeft, X, Home,
  Shield, AlertTriangle, Bell, Activity, Link, Ban, FlaskConical,
  FileText, Timer, Briefcase, Send, Zap, Sparkles, MonitorDown,
} from 'lucide-react';
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

const djb2 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
};

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

const IDLE_MS = 3 * 60 * 1000;
const getRecentSearchesKey = (userId?: number) =>
  userId ? `heimdall_recent_searches_${userId}` : 'heimdall_recent_searches_anonymous';

function usePresenceStatus() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const reset = () => {
      setIsActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setIsActive(false), IDLE_MS);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel', 'click'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));

    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        clearTimeout(timer);
        setIsActive(false);
      } else {
        reset();
      }
    };

    document.addEventListener('visibilitychange', onVis);
    reset();

    return () => {
      clearTimeout(timer);
      events.forEach(e => window.removeEventListener(e, reset));
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return isActive;
}

const UserAvatar = ({
  email,
  size = "sm",
  isActive = true,
}: {
  email: string;
  size?: "sm" | "md";
  isActive?: boolean;
}) => {
  const token = AVATAR_TOKENS[djb2(email || "user@heimdall") % AVATAR_TOKENS.length];
  const dim = size === "sm" ? 28 : 40;

  return (
    <div
      style={{
        width: dim,
        height: dim,
        borderRadius: "50%",
        flexShrink: 0,
        background: `linear-gradient(135deg, ${token.from}, ${token.to})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `0 0 0 1.5px ${token.to}30, 0 1px 4px ${token.from}55`,
        position: "relative",
      }}
    >
      {token.svg}
      <span
        style={{
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 8,
          height: 8,
          borderRadius: "50%",
          border: "1.5px solid white",
        }}
      >
        {isActive && (
          <span
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              background: "#22c55e",
              opacity: 0.75,
              animation: "ping 1.4s cubic-bezier(0,0,0.2,1) infinite",
            }}
          />
        )}
        <span
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: isActive ? "#22c55e" : "#eab308",
            transition: "background 0.6s ease",
          }}
        />
        <style>{`@keyframes ping { 75%, 100% { transform: scale(2.2); opacity: 0; } }`}</style>
      </span>
    </div>
  );
};

const resolvePath = (path: string): string => {
  if (path.includes(':id')) {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) return '/platforms';
    return path.replace(':id', platformId);
  }
  return path;
};

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
  { label: 'Heimdall AI', path: '/heimdall-ai', keywords: ['heimdall', 'ai', 'chat', 'assistant', 'security', 'chatbot', 'intelligence', 'analysis'], icon: Zap },
];

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

const IconBtn = ({
  children,
  onClick,
  title,
  colorClass = "text-slate-500 dark:text-slate-400",
  hoverClass = "hover:bg-slate-100 dark:hover:bg-slate-800/60",
  badge,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  colorClass?: string;
  hoverClass?: string;
  badge?: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    title={title}
    className={`relative flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-150 ${colorClass} ${hoverClass}`}
  >
    {children}
    {badge}
  </button>
);

const HeimdallAIButton = ({ onClick }: { onClick: () => void }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      initial={false}
      animate={{ width: hovered ? 132 : 42 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.7 }}
      aria-label="Heimdall AI"
      className={`ml-1.5 flex h-10 items-center overflow-hidden rounded-full ${
        hovered
          ? 'bg-white/95 dark:bg-slate-900/90 ring-1 ring-slate-200/80 dark:ring-slate-700/50 shadow-[0_8px_20px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_20px_rgba(2,6,23,0.28)]'
          : 'bg-transparent ring-1 ring-transparent shadow-none'
      }`}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
        <Sparkles
          className="h-[22px] w-[22px] text-blue-600 dark:text-blue-400"
          strokeWidth={2.2}
        />
      </span>

      <motion.span
        initial={false}
        animate={{
          opacity: hovered ? 1 : 0,
          x: hovered ? 0 : -10,
        }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="pr-4 whitespace-nowrap text-[13px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100"
      >
        Heimdall AI
      </motion.span>
    </motion.button>
  );
};

// ── PWA Install Button ─────────────────────────────────────────────────────────
const PWAInstallButton: React.FC = () => {
  const [hovered, setHovered] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!installPrompt) return null;

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setInstallPrompt(null);
  };

  return (
    <motion.button
      onClick={handleInstall}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      initial={false}
      animate={{ width: hovered ? 128 : 42 }}
      transition={{ type: "spring", stiffness: 420, damping: 30, mass: 0.7 }}
      aria-label="Install App"
      className={`ml-1.5 flex h-10 items-center overflow-hidden rounded-full ${
        hovered
          ? 'bg-white/95 dark:bg-slate-900/90 ring-1 ring-slate-200/80 dark:ring-slate-700/50 shadow-[0_8px_20px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_20px_rgba(2,6,23,0.28)]'
          : 'bg-transparent ring-1 ring-transparent shadow-none'
      }`}
    >
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
        <MonitorDown
          className="h-[20px] w-[20px] text-slate-600 dark:text-slate-300"
          strokeWidth={2.2}
        />
      </span>
      <motion.span
        initial={false}
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : -10 }}
        transition={{ duration: 0.16, ease: 'easeOut' }}
        className="pr-4 whitespace-nowrap text-[13px] font-semibold leading-none tracking-tight text-slate-900 dark:text-slate-100"
      >
        Install App
      </motion.span>
    </motion.button>
  );
};

const PlatformIndicator: React.FC = () => {
  const { hasSelectedPlatform, selectedPlatformId: platformId } = usePlatform();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isActivePresence = usePresenceStatus();
  const isOnPlatformsPage = location.pathname === '/platforms';
  const { toast } = useToast();

  const [manualStatus, setManualStatus] = useState<'active' | 'away' | null>(null);
  const [, setLoadingStatus] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiService.getUserStatus();
        setManualStatus(data.status as 'active' | 'away');
      } catch {
        setManualStatus('active');
      } finally {
        setLoadingStatus(false);
      }
    };
    fetchStatus();
  }, []);

  const setAndPersistStatus = async (status: 'active' | 'away') => {
    const previous = manualStatus;
    setManualStatus(status);

    try {
      await apiService.updateUserStatus(status);
      toast({
        title: "Status updated",
        description: `Your status is now ${status}.`,
        variant: "default",
      });
    } catch {
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
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('heimdall_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('heimdall_theme', 'light');
    }
  }, [isDark]);

  const [hasPendingInvitations, setHasPendingInvitations] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const [orgReceived, orgSent] = await Promise.allSettled([
          apiService.getMyInvitations('received'),
          apiService.getMyInvitations('sent'),
        ]);

        const toArr = (r: PromiseSettledResult<any>) =>
          r.status === 'fulfilled'
            ? (Array.isArray(r.value) ? r.value : r.value?.results ?? [])
            : [];

        const received = toArr(orgReceived);
        const sent = toArr(orgSent);

        const hasPending =
          received.some((inv: any) => String(inv.status).toLowerCase() === 'pending') ||
          sent.some((inv: any) => String(inv.status).toLowerCase() === 'pending');

        setHasPendingInvitations(hasPending);
      } catch {
        setHasPendingInvitations(false);
      }
    };

    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(getRecentSearchesKey(user?.id)) || '[]');
    } catch {
      return [];
    }
  });

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchResults = searchQuery.trim()
    ? PAGE_INDEX.map(p => ({ ...p, score: scoreResult(p, searchQuery) }))
        .filter(p => p.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
    : [];

  const showDropdown =
    searchOpen && (searchQuery.trim() ? searchResults.length > 0 : recentSearches.length > 0);

  const saveRecent = useCallback((label: string) => {
    setRecentSearches(prev => {
      const updated = [label, ...prev.filter(r => r !== label)].slice(0, 5);
      try {
        localStorage.setItem(getRecentSearchesKey(user?.id), JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [user?.id]);

  const navigateTo = useCallback((path: string, label: string) => {
    const resolvedPath = resolvePath(path);
    saveRecent(label);

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

  useEffect(() => {
    if (!searchOpen) return;

    const items = searchQuery.trim()
      ? searchResults
      : recentSearches.map(r => PAGE_INDEX.find(p => p.label === r)).filter(Boolean) as typeof PAGE_INDEX;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, items.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const item = items[selectedIndex];
        if (item) navigateTo(item.path, item.label);
      } else if (e.key === 'Escape') {
        setSearchOpen(false);
        setSearchQuery('');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [searchOpen, searchQuery, searchResults, recentSearches, selectedIndex, navigateTo]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

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
    try {
      await logout();
      navigate('/login');
    } catch {}
  };

  const recentItems =
    recentSearches.map(r => PAGE_INDEX.find(p => p.label === r)).filter(Boolean) as typeof PAGE_INDEX;
  const dropdownItems = searchQuery.trim() ? searchResults : recentItems;

  const displayName = user?.first_name
    ? `${user.first_name} ${user.last_name || ''}`.trim()
    : user?.email?.split('@')[0] || 'User';

  return (
    <div className="flex items-center gap-1.5 w-full">
      <div className="flex items-center gap-0">
        <div ref={searchRef} className="relative">
          <div className={`
            relative flex items-center gap-2 h-9 rounded-2xl px-3 w-64 transition-all duration-200
            ${searchOpen
              ? 'bg-white dark:bg-slate-900 ring-2 ring-blue-500/30 shadow-[0_0_0_4px_rgba(37,99,235,0.06)] dark:shadow-[0_0_0_4px_rgba(37,99,235,0.12)]'
              : 'bg-slate-100/80 dark:bg-slate-800/60 ring-1 ring-slate-200/60 dark:ring-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/80'
            }
          `}>
            <Search className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search pages…"
              className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none w-full"
            />
            {searchQuery ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  inputRef.current?.focus();
                }}
                className="flex-shrink-0 rounded-md p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X className="h-3 w-3 text-slate-400" />
              </button>
            ) : (
              <div className="flex-shrink-0 flex items-center gap-0.5 rounded-lg border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 bg-white dark:bg-slate-800">
                <Command className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500" />
                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">K</span>
              </div>
            )}
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.6 }}
                className="absolute top-full mt-2 left-0 w-72 z-50 overflow-hidden"
                style={{
                  borderRadius: 18,
                  border: '1px solid rgba(148,163,184,0.15)',
                  background: 'var(--search-bg, rgba(255,255,255,0.95))',
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 20px 40px rgba(15,23,42,0.12), 0 1px 0 rgba(255,255,255,0.8) inset',
                }}
              >
                <style>{`.dark { --search-bg: rgba(15,23,42,0.95); }`}</style>
                <div
                  style={{
                    height: 1,
                    background: 'linear-gradient(90deg, transparent 0%, rgba(37,99,235,0.4) 40%, rgba(6,182,212,0.4) 60%, transparent 100%)',
                  }}
                />
                <div className="flex items-center justify-between px-4 pt-3 pb-2">
                  <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 dark:text-slate-500">
                    {searchQuery.trim()
                      ? `${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`
                      : 'Recent'}
                  </span>
                  {!searchQuery.trim() && recentSearches.length > 0 && (
                    <button
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem(getRecentSearchesKey(user?.id));
                      }}
                      className="text-[9px] font-semibold text-slate-400 dark:text-slate-500 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="px-2 pb-2 space-y-0.5">
                  {dropdownItems.map((item, i) => {
                    const IconComponent = item.icon;
                    const active = selectedIndex === i;

                    return (
                      <motion.button
                        key={item.label + i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.025, duration: 0.15 }}
                        onClick={() => navigateTo(item.path, item.label)}
                        onMouseEnter={() => setSelectedIndex(i)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all duration-100
                          ${active
                            ? 'bg-blue-50 dark:bg-blue-500/10 rounded-[12px]'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-[12px]'
                          }
                        `}
                      >
                        <div className={`
                          flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl transition-colors
                          ${active ? 'bg-blue-100 dark:bg-blue-500/20' : 'bg-slate-100 dark:bg-slate-800'}
                        `}>
                          <IconComponent
                            className={`h-3.5 w-3.5 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-semibold block transition-colors ${active ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate block">
                            {item.path}
                          </span>
                        </div>

                        {active && (
                          <div className="flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-md bg-blue-100 dark:bg-blue-500/20">
                            <CornerDownLeft className="h-3 w-3 text-blue-500 dark:text-blue-400" />
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="border-t border-slate-100 dark:border-slate-800/60 px-4 py-2 flex items-center gap-4">
                  {[
                    { icon: <><ArrowUp className="h-2.5 w-2.5" /><ArrowDown className="h-2.5 w-2.5" /></>, label: 'navigate' },
                    { icon: <CornerDownLeft className="h-2.5 w-2.5" />, label: 'select' },
                    { icon: <span className="text-[8px] font-bold">esc</span>, label: 'close' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="flex items-center gap-0.5 text-slate-400 dark:text-slate-600">{icon}</div>
                      <span className="text-[9px] text-slate-400 dark:text-slate-600 font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <HeimdallAIButton onClick={() => navigate('/heimdall-ai')} />
      </div>

      <div className="flex-1" />

      {/* <PWAInstallButton /> — Chrome shows its own install prompt via the manifest; re-enable if a custom in-app button is ever needed */}

      <div className="flex items-center gap-1 rounded-2xl bg-slate-100/70 dark:bg-slate-800/40 ring-1 ring-slate-200/60 dark:ring-slate-700/30 px-1.5 py-1">
        <IconBtn
          onClick={() => navigate('/invitations')}
          title="Invitations"
          colorClass="text-emerald-600 dark:text-emerald-400"
          hoverClass="hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30"
          badge={
            hasPendingInvitations ? (
              <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-[1.5px] ring-white dark:ring-slate-800" />
              </span>
            ) : undefined
          }
        >
          <Mail className="h-4 w-4" />
        </IconBtn>

        <IconBtn
          onClick={() => setIsDark(p => !p)}
          title={isDark ? "Switch to light" : "Switch to dark"}
          colorClass="text-amber-500 dark:text-amber-400"
          hoverClass="hover:bg-amber-100/70 dark:hover:bg-amber-900/30"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={isDark ? 'sun' : 'moon'}
              initial={{ opacity: 0, rotate: -30, scale: 0.7 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 30, scale: 0.7 }}
              transition={{ duration: 0.18 }}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </motion.div>
          </AnimatePresence>
        </IconBtn>

        <div className="h-5 w-px bg-slate-200 dark:bg-slate-700/60 mx-0.5" />

        <button
          onClick={() => navigate('/platforms')}
          className={`
            flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-150
            ${isOnPlatformsPage || !hasSelectedPlatform
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700/40'
            }
          `}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              isOnPlatformsPage || !hasSelectedPlatform
                ? 'bg-blue-400 dark:bg-blue-500'
                : 'bg-emerald-400'
            }`}
          />
          <span className="hidden sm:block">
            {isOnPlatformsPage || !hasSelectedPlatform ? 'Select Workspace' : 'Workspace'}
          </span>
          <Globe className="h-3.5 w-3.5 sm:hidden" />
          <ChevronDown className="h-3 w-3 opacity-50" />
        </button>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center rounded-2xl px-1.5 py-1 transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/50 ring-1 ring-transparent hover:ring-slate-200/60 dark:hover:ring-slate-700/40">
            <UserAvatar email={user?.email || ""} size="md" isActive={effectiveStatus} />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-56 p-1.5 overflow-hidden"
          style={{
            borderRadius: 20,
            border: '1px solid rgba(148,163,184,0.15)',
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 48px rgba(15,23,42,0.14), 0 1px 0 rgba(255,255,255,0.8) inset',
          }}
        >
          <style>{`.dark [data-radix-popper-content-wrapper] [role="menu"] { background: rgba(15,23,42,0.95) !important; box-shadow: 0 24px 48px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset !important; }`}</style>

          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 32, mass: 0.6 }}
          >
            <div
              style={{
                height: 1,
                margin: '0 8px 8px',
                borderRadius: 1,
                background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.3), rgba(6,182,212,0.3), transparent)',
              }}
            />

            <DropdownMenuLabel className="pb-2">
              <div className="flex items-center gap-3 px-2 py-1">
                <UserAvatar email={user?.email || ""} size="md" isActive={effectiveStatus} />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-900 dark:text-white truncate">{displayName}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</div>
                </div>
              </div>
            </DropdownMenuLabel>

            <div className="mx-2 mb-2 rounded-[14px] bg-slate-50 dark:bg-slate-800/60 p-1.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 px-2 mb-1">
                Status
              </p>

              <button
                onClick={() => setAndPersistStatus('active')}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl transition-all ${
                  effectiveStatus ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    {effectiveStatus && (
                      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                    )}
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#22c55e',
                        boxShadow: '0 0 6px #22c55e99',
                      }}
                    />
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
                </div>
                {effectiveStatus && <Check className="h-3 w-3 text-emerald-500" />}
              </button>

              <button
                onClick={() => setAndPersistStatus('away')}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl transition-all ${
                  !effectiveStatus ? 'bg-amber-50 dark:bg-amber-900/20' : 'hover:bg-slate-100 dark:hover:bg-slate-700/40'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#eab308',
                      boxShadow: '0 0 6px #eab30899',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Away</span>
                </div>
                {!effectiveStatus && <Check className="h-3 w-3 text-amber-500" />}
              </button>
            </div>

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2" />

            {[
              { label: 'Users & Teams', icon: Users, path: '/users' },
              { label: 'Audit Logs', icon: Clock, path: '/audit-logs' },
              { label: 'Settings', icon: Settings, path: '/settings' },
            ].map(({ label, icon: Icon, path }) => (
              <DropdownMenuItem
                key={label}
                onClick={() => navigate(path)}
                className="mx-1 rounded-[12px] gap-2.5 cursor-pointer"
              >
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                  <Icon className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="text-xs font-medium">{label}</span>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 mx-2 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="mx-1 rounded-[12px] gap-2.5 cursor-pointer text-red-500 dark:text-red-400 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30">
                <LogOut className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
              </div>
              <span className="text-xs font-medium">Log out</span>
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PlatformIndicator;