import React, { useState, useEffect } from 'react';
import { Globe, ChevronDown, Mail, Settings, LogOut, Sun, Moon, Users, Clock, Search } from 'lucide-react';
import { usePlatform } from '@/contexts/PlatformContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { motion } from 'framer-motion';

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic hash & avatar tokens (exactly as in AppSidebar)
// ─────────────────────────────────────────────────────────────────────────────
const djb2 = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (h * 33) ^ s.charCodeAt(i);
  return Math.abs(h >>> 0);
};

const AVATAR_TOKENS = [
  // 0 — Circuit node / deep blue-cyan
  {
    from: "#1e3a8a", to: "#06b6d4",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.95" />
        <circle cx="3" cy="3" r="1.5" fill="white" fillOpacity="0.6" />
        <circle cx="17" cy="3" r="1.5" fill="white" fillOpacity="0.6" />
        <circle cx="3" cy="17" r="1.5" fill="white" fillOpacity="0.6" />
        <circle cx="17" cy="17" r="1.5" fill="white" fillOpacity="0.6" />
        <line x1="3" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" />
        <line x1="17" y1="3" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" />
        <line x1="3" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" />
        <line x1="17" y1="17" x2="10" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" />
      </svg>
    ),
  },
  // 1 — Satellite dish / slate-indigo
  {
    from: "#312e81", to: "#6366f1",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M3 14 Q6 8 13 5" stroke="white" strokeOpacity="0.9" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M5 16 Q9 11 15 8" stroke="white" strokeOpacity="0.55" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M7 18 Q12 14 17 11" stroke="white" strokeOpacity="0.3" strokeWidth="0.9" strokeLinecap="round" />
        <circle cx="13.5" cy="4.5" r="2.5" fill="white" fillOpacity="0.9" />
        <circle cx="13.5" cy="4.5" r="1" fill="white" />
      </svg>
    ),
  },
  // 2 — Fingerprint / rose-orange
  {
    from: "#be123c", to: "#f97316",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M10 3 C6.5 3 4 5.8 4 9 C4 11.5 5 13.5 6.5 15" stroke="white" strokeOpacity="0.95" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M10 5.5 C7.5 5.5 6 7.2 6 9 C6 10.5 6.8 11.8 8 13" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M10 8 C9 8 8.5 8.6 8.5 9.2 C8.5 9.8 9 10.8 9.5 11.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" />
        <path d="M10 5.5 C12.5 5.5 14 7.2 14 9 C14 11 12.5 13 11 14.5 C13 13.5 16 11 16 9 C16 5.8 13.5 3 10 3" stroke="white" strokeOpacity="0.5" strokeWidth="1.1" strokeLinecap="round" />
      </svg>
    ),
  },
  // 3 — Neural net / emerald-teal
  {
    from: "#065f46", to: "#14b8a6",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <circle cx="4" cy="5" r="1.8" fill="white" fillOpacity="0.9" />
        <circle cx="4" cy="10" r="1.8" fill="white" fillOpacity="0.9" />
        <circle cx="4" cy="15" r="1.8" fill="white" fillOpacity="0.9" />
        <circle cx="10" cy="7.5" r="1.8" fill="white" fillOpacity="0.75" />
        <circle cx="10" cy="12.5" r="1.8" fill="white" fillOpacity="0.75" />
        <circle cx="16" cy="10" r="1.8" fill="white" fillOpacity="0.9" />
        <line x1="5.8" y1="5.2" x2="8.2" y2="7.3" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
        <line x1="5.8" y1="10" x2="8.2" y2="7.5" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
        <line x1="5.8" y1="10" x2="8.2" y2="12.5" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
        <line x1="5.8" y1="14.8" x2="8.2" y2="12.7" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
        <line x1="11.8" y1="7.5" x2="14.2" y2="9.8" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
        <line x1="11.8" y1="12.5" x2="14.2" y2="10.2" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
      </svg>
    ),
  },
  // 4 — Lock shield / dark-blue violet
  {
    from: "#1e1b4b", to: "#7c3aed",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M10 2 L16 5 L16 10 C16 13.5 13 16.5 10 18 C7 16.5 4 13.5 4 10 L4 5 Z" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" />
        <rect x="7.5" y="9" width="5" height="4" rx="1" fill="white" fillOpacity="0.9" />
        <path d="M8.5 9 L8.5 7.5 C8.5 6.4 11.5 6.4 11.5 7.5 L11.5 9" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <circle cx="10" cy="11" r="0.8" fill="white" fillOpacity="0.5" />
      </svg>
    ),
  },
  // 5 — Data stack / amber-orange
  {
    from: "#92400e", to: "#fbbf24",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <ellipse cx="10" cy="5.5" rx="6" ry="2" fill="white" fillOpacity="0.9" />
        <path d="M4 5.5 L4 10 C4 11.1 6.7 12 10 12 C13.3 12 16 11.1 16 10 L16 5.5" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
        <path d="M4 10 L4 14.5 C4 15.6 6.7 16.5 10 16.5 C13.3 16.5 16 15.6 16 14.5 L16 10" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" />
      </svg>
    ),
  },
  // 6 — Terminal prompt / slate-green
  {
    from: "#0f172a", to: "#22c55e",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <rect x="2.5" y="4" width="15" height="12" rx="2.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.8" strokeWidth="1.2" />
        <path d="M5.5 8 L8 10 L5.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="9.5" y1="12" x2="14" y2="12" stroke="white" strokeOpacity="0.7" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  // 7 — Waveform / cyan-blue
  {
    from: "#0c4a6e", to: "#38bdf8",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <polyline points="2,10 4,10 5,6 6,14 7.5,8 9,13 10.5,7 12,13 13.5,9 15,11 16,10 18,10" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    ),
  },
  // 8 — Hexagon grid / indigo-pink
  {
    from: "#4338ca", to: "#ec4899",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <polygon points="10,2 13.5,4 13.5,8 10,10 6.5,8 6.5,4" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" />
        <polygon points="10,10 13.5,12 13.5,16 10,18 6.5,16 6.5,12" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.55" strokeWidth="1" />
        <circle cx="10" cy="6" r="1.5" fill="white" fillOpacity="0.9" />
      </svg>
    ),
  },
  // 9 — Cloud upload / sky-blue
  {
    from: "#075985", to: "#7dd3fc",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M5.5 14 C3.5 14 2 12.5 2 10.5 C2 8.8 3.2 7.4 4.9 7.1 C4.7 6.7 4.5 6.2 4.5 5.5 C4.5 3.6 6.1 2 8 2 C9.4 2 10.6 2.8 11.2 4 C11.5 3.9 11.8 3.8 12.2 3.8 C14.1 3.8 15.6 5.3 15.6 7.2 C15.6 7.3 15.6 7.4 15.6 7.5 C16.9 7.9 18 9 18 10.5 C18 12.5 16.4 14 14.5 14" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        <path d="M10 17 L10 10" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" />
        <path d="M7.5 12 L10 9.5 L12.5 12" stroke="white" strokeOpacity="0.9" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  // 10 — DNA helix / violet-fuchsia
  {
    from: "#5b21b6", to: "#d946ef",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M7 2 C7 5 13 6 13 10 C13 14 7 15 7 18" stroke="white" strokeOpacity="0.9" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M13 2 C13 5 7 6 7 10 C7 14 13 15 13 18" stroke="white" strokeOpacity="0.5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <line x1="7.5" y1="5.5" x2="12.5" y2="5.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="8.5" y1="10" x2="11.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="7.5" y1="14.5" x2="12.5" y2="14.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
  // 11 — Binary grid / green-teal
  {
    from: "#064e3b", to: "#10b981",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <text x="2" y="8" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text>
        <text x="10" y="8" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text>
        <text x="2" y="13" fontSize="5" fill="white" fillOpacity="0.5" fontFamily="monospace" fontWeight="bold">01</text>
        <text x="10" y="13" fontSize="5" fill="white" fillOpacity="0.95" fontFamily="monospace" fontWeight="bold">10</text>
        <text x="2" y="18" fontSize="5" fill="white" fillOpacity="0.3" fontFamily="monospace" fontWeight="bold">11</text>
        <text x="10" y="18" fontSize="5" fill="white" fillOpacity="0.6" fontFamily="monospace" fontWeight="bold">00</text>
      </svg>
    ),
  },
  // 12 — Gear cog / slate-orange
  {
    from: "#1e293b", to: "#f97316",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <circle cx="10" cy="10" r="3" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" />
        <circle cx="10" cy="10" r="1.2" fill="white" fillOpacity="0.9" />
        <path d="M10 2.5 L10 4.5 M10 15.5 L10 17.5 M2.5 10 L4.5 10 M15.5 10 L17.5 10 M4.4 4.4 L5.8 5.8 M14.2 14.2 L15.6 15.6 M15.6 4.4 L14.2 5.8 M5.8 14.2 L4.4 15.6" stroke="white" strokeOpacity="0.7" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  // 13 — Signal bars / blue-pink
  {
    from: "#1d4ed8", to: "#f472b6",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <rect x="2" y="14" width="3" height="4" rx="1" fill="white" fillOpacity="0.5" />
        <rect x="6.5" y="11" width="3" height="7" rx="1" fill="white" fillOpacity="0.7" />
        <rect x="11" y="7.5" width="3" height="10.5" rx="1" fill="white" fillOpacity="0.85" />
        <rect x="15.5" y="4" width="3" height="14" rx="1" fill="white" fillOpacity="0.95" />
      </svg>
    ),
  },
  // 14 — Atom / deep teal
  {
    from: "#0f766e", to: "#a7f3d0",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none" />
        <ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.6" strokeWidth="1.2" fill="none" transform="rotate(60 10 10)" />
        <ellipse cx="10" cy="10" rx="8" ry="3.2" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" transform="rotate(120 10 10)" />
        <circle cx="10" cy="10" r="1.8" fill="white" fillOpacity="0.95" />
      </svg>
    ),
  },
  // 15 — Radar sweep / navy-lime
  {
    from: "#1a2e05", to: "#84cc16",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.3" strokeWidth="1" fill="none" />
        <circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1" fill="none" />
        <circle cx="10" cy="10" r="2.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none" />
        <line x1="10" y1="10" x2="10" y2="2.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="10" y1="10" x2="16.5" y2="6.5" stroke="white" strokeOpacity="0.35" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="14.5" cy="5.5" r="1.2" fill="white" fillOpacity="0.9" />
      </svg>
    ),
  },
  // 16 — Lightning bolt / dark-yellow
  {
    from: "#713f12", to: "#facc15",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M11.5 2 L5.5 11.5 L9.5 11.5 L8.5 18 L14.5 8.5 L10.5 8.5 Z" fill="white" fillOpacity="0.95" />
      </svg>
    ),
  },
  // 17 — Globe wireframe / slate-cyan
  {
    from: "#0f2744", to: "#22d3ee",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" fill="none" />
        <ellipse cx="10" cy="10" rx="4" ry="7.5" stroke="white" strokeOpacity="0.55" strokeWidth="1" fill="none" />
        <line x1="2.5" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.55" strokeWidth="1" />
        <path d="M3.5 6.5 Q10 5 16.5 6.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.9" fill="none" />
        <path d="M3.5 13.5 Q10 15 16.5 13.5" stroke="white" strokeOpacity="0.4" strokeWidth="0.9" fill="none" />
      </svg>
    ),
  },
  // 18 — QR/matrix dots / gray-violet
  {
    from: "#18181b", to: "#818cf8",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <rect x="2" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="3" y="3" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" />
        <rect x="13" y="2" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="14" y="3" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" />
        <rect x="2" y="13" width="5" height="5" rx="1" fill="white" fillOpacity="0.9" />
        <rect x="3" y="14" width="3" height="3" rx="0.5" fill="white" fillOpacity="0.2" />
        <rect x="9" y="2" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" />
        <rect x="9" y="5.5" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" />
        <rect x="13" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" />
        <rect x="9" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.9" />
        <rect x="16" y="9" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.5" />
        <rect x="9" y="13" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.6" />
        <rect x="13" y="13" width="5" height="2" rx="0.5" fill="white" fillOpacity="0.4" />
        <rect x="13" y="16" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7" />
        <rect x="16" y="16" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.4" />
      </svg>
    ),
  },
  // 19 — Rocket / red-amber
  {
    from: "#7f1d1d", to: "#fb923c",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M10 2 C10 2 14 5 14 10 L12.5 13 L7.5 13 L6 10 C6 5 10 2 10 2 Z" fill="white" fillOpacity="0.9" />
        <path d="M7.5 13 L6 16 L8 15 Z" fill="white" fillOpacity="0.6" />
        <path d="M12.5 13 L14 16 L12 15 Z" fill="white" fillOpacity="0.6" />
        <circle cx="10" cy="8.5" r="1.8" fill="white" fillOpacity="0.2" stroke="white" strokeOpacity="0.6" strokeWidth="1" />
      </svg>
    ),
  },
  // 20 — Infinity / blue-purple
  {
    from: "#1d4ed8", to: "#a855f7",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M3.5 10 C3.5 7.5 5.2 5.5 7.5 5.5 C9 5.5 10 6.5 10 6.5 C10 6.5 11 5.5 12.5 5.5 C14.8 5.5 16.5 7.5 16.5 10 C16.5 12.5 14.8 14.5 12.5 14.5 C11 14.5 10 13.5 10 13.5 C10 13.5 9 14.5 7.5 14.5 C5.2 14.5 3.5 12.5 3.5 10 Z" stroke="white" strokeOpacity="0.95" strokeWidth="1.5" fill="none" />
        <circle cx="7.5" cy="10" r="1.3" fill="white" fillOpacity="0.9" />
        <circle cx="12.5" cy="10" r="1.3" fill="white" fillOpacity="0.5" />
      </svg>
    ),
  },
  // 21 — Server stack / teal-lime
  {
    from: "#134e4a", to: "#86efac",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <rect x="2.5" y="3" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.15" stroke="white" strokeOpacity="0.9" strokeWidth="1.2" />
        <rect x="2.5" y="8" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.1" stroke="white" strokeOpacity="0.65" strokeWidth="1.2" />
        <rect x="2.5" y="13" width="15" height="4" rx="1.5" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" />
        <circle cx="14.5" cy="5" r="1" fill="white" fillOpacity="0.9" />
        <circle cx="14.5" cy="10" r="1" fill="white" fillOpacity="0.6" />
        <circle cx="14.5" cy="15" r="1" fill="white" fillOpacity="0.35" />
      </svg>
    ),
  },
  // 22 — Command key / charcoal-blue
  {
    from: "#0f172a", to: "#60a5fa",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <path d="M7 7 L7 5 C7 3.9 7.9 3 9 3 C10.1 3 11 3.9 11 5 L11 7 L13 7 L13 5 C13 3.9 13.9 3 15 3 C16.1 3 17 3.9 17 5 C17 6.1 16.1 7 15 7 L13 7 L13 9 L15 9 C16.1 9 17 9.9 17 11 C17 12.1 16.1 13 15 13 L13 13 L13 15 C13 16.1 12.1 17 11 17 C9.9 17 9 16.1 9 15 L9 13 L7 13 L7 15 C7 16.1 6.1 17 5 17 C3.9 17 3 16.1 3 15 C3 13.9 3.9 13 5 13 L7 13 L7 11 L5 11 C3.9 11 3 10.1 3 9 C3 7.9 3.9 7 5 7 L7 7 Z M9 7 L9 9 L11 9 L11 7 Z M9 11 L9 13 L11 13 L11 11 Z" fill="white" fillOpacity="0.9" />
      </svg>
    ),
  },
  // 23 — Pulse / magenta-red
  {
    from: "#831843", to: "#fb7185",
    svg: (
      <svg viewBox="0 0 20 20" fill="none" width="18" height="18">
        <circle cx="10" cy="10" r="7.5" stroke="white" strokeOpacity="0.25" strokeWidth="1" fill="none" />
        <circle cx="10" cy="10" r="5" stroke="white" strokeOpacity="0.4" strokeWidth="1.2" fill="none" />
        <circle cx="10" cy="10" r="2.5" fill="white" fillOpacity="0.9" />
        <line x1="10" y1="2.5" x2="10" y2="5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="10" y1="15" x2="10" y2="17.5" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="2.5" y1="10" x2="5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="15" y1="10" x2="17.5" y2="10" stroke="white" strokeOpacity="0.7" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const UserAvatar = ({ email, size = "sm" }: { email: string; size?: "sm" | "md" }) => {
  const hash = djb2(email || "user@heimdall");
  const token = AVATAR_TOKENS[hash % AVATAR_TOKENS.length];
  const dim = size === "sm" ? 28 : 36;
  return (
    <div
      style={{
        width: dim, height: dim, borderRadius: "50%", flexShrink: 0,
        background: `linear-gradient(135deg, ${token.from}, ${token.to})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 0 1.5px ${token.to}30, 0 1px 4px ${token.from}55`,
        position: "relative",
      }}
    >
      {token.svg}
      <span
        style={{
          position: "absolute", bottom: -1, right: -1,
          width: 8, height: 8, borderRadius: "50%",
          background: "#22c55e", border: "1.5px solid white",
        }}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PlatformIndicator component – FIXED: removed asChild from DropdownMenuContent
// ─────────────────────────────────────────────────────────────────────────────
const PlatformIndicator: React.FC = () => {
  const { hasSelectedPlatform } = usePlatform();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isOnPlatformsPage = location.pathname === '/platforms';

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

  const toggleTheme = () => setIsDark(prev => !prev);

  const [hasPendingInvitations, setHasPendingInvitations] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleInvitationsClick = () => navigate('/invitations');
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const iconButtonClass = "flex items-center justify-center rounded-full p-1.5 transition-colors";
  const cleanPlatformButtonClass = (isActive: boolean) =>
    `flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
      isActive
        ? "text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
        : "text-orange-500 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950"
    }`;

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Search bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1.5 w-56 focus-within:ring-2 focus-within:ring-blue-400/40 transition-shadow"
      >
        <Search className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search…"
          className="bg-transparent text-xs text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 outline-none w-full"
        />
      </form>

      <div className="flex-1" />

      {/* Invitation button */}
      <button
        onClick={handleInvitationsClick}
        className={`${iconButtonClass} text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950`}
        title="Invitations"
      >
        <div className="relative">
          <Mail className="h-5 w-5" />
          {hasPendingInvitations && (
            <span className="absolute -bottom-1 -right-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
          )}
        </div>
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`${iconButtonClass} text-amber-500 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950`}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>

      {/* Workspace selector */}
      <button
        onClick={() => navigate('/platforms')}
        className={cleanPlatformButtonClass(isOnPlatformsPage || !hasSelectedPlatform)}
      >
        <Globe className="h-4 w-4" />
        {isOnPlatformsPage || !hasSelectedPlatform ? 'Select Workspace' : 'Workspace Selected'}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {/* Account dropdown – FIXED: removed `asChild` and used motion.div inside */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className={`${iconButtonClass} hover:bg-gray-100 dark:hover:bg-gray-800`}
            title="Account"
          >
            <UserAvatar email={user?.email || ""} size="sm" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-48 rounded-[30px] border border-white/20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-2xl p-1">
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 30, mass: 0.7 }}
          >
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 dark:text-white">
                  {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200/50 dark:bg-gray-700/50" />
            <DropdownMenuItem onClick={() => navigate('/users')} className="rounded-3xl mx-1">
              <Users className="mr-2 h-4 w-4" />
              <span>Users & Teams</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/audit-logs')} className="rounded-3xl mx-1">
              <Clock className="mr-2 h-4 w-4" />
              <span>Audit Logs</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-3xl mx-1">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout} className="rounded-3xl mx-1">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </motion.div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default PlatformIndicator;