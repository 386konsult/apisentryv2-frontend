import type { ElementType } from "react";
import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Shield, AlertTriangle, Globe, Settings, Users, Code, LogOut,
  Search, Clock, FileText, LayoutDashboard, Link2, BookOpen, Bell, BarChart3, Mail, Gauge, Sparkles,
} from "lucide-react";
import HeimdallAILogo from "@/components/HeimdallAILogo";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/contexts/PlatformContext";

// ── Unique click animations (unchanged) ──────────────────────────────────────
const ANIM: Record<string, { a: object; ms: number }> = {
  "Dashboard": { a: { scaleY: [1, 0.25, 1.7, 0.8, 1.15, 1], originY: 1 }, ms: 600 },
  "Security Hub": { a: { x: [0, 11, -4, 7, 0], rotate: [0, 14, -8, 3, 0] }, ms: 500 },
  "Threat Logs": { a: { x: [0, -8, 8, -6, 6, -4, 4, -2, 0], y: [0, -3, 3, -2, 2, 0] }, ms: 480 },
  "Security Alerts": { a: { rotate: [0, 32, -26, 18, -13, 9, -5, 2, 0], originY: 0 }, ms: 720 },
  "Incidents": { a: { rotateY: [0, 90, 180, 270, 360] }, ms: 560 },
  "API Endpoints": { a: { rotate: [0, 270, 340, 355, 360] }, ms: 680 },
  "IP Blacklist": { a: { scale: [1, 0.65, 1.5, 0.85, 1.15, 1], rotate: [0, -5, 5, -2, 0] }, ms: 580 },
  "Playground": { a: { scaleX: [1, 0.7, 1.4, 0.85, 1.12, 1], x: [0, -5, 5, -3, 3, 0] }, ms: 520 },
  "Dashboard ": { a: { scale: [1, 0.45, 1.5, 0.88, 1.1, 1], rotate: [0, -12, 8, -3, 0] }, ms: 620 },
  "Connect Repo": { a: { scaleX: [1, 0.55, 1.4, 0.85, 1.1, 1], y: [0, -4, 4, -2, 0] }, ms: 540 },
  "Repositories": { a: { scaleX: [1, 1.55, 0.7, 1.25, 0.88, 1.06, 1] }, ms: 580 },
  "Scan Reports": { a: { y: [0, 9, -12, 5, -3, 1, 0], scaleY: [1, 1.12, 0.82, 1.06, 1] }, ms: 540 },
  "Git Auto Scan": { a: { rotate: [0, 360, 720, 1080] }, ms: 750 },
  "Users & Teams": { a: { y: [0, -10, 3, -6, 1, -2, 0], scale: [1, 1.14, 0.9, 1.06, 1] }, ms: 580 },
  "Settings": { a: { rotate: [0, -55, 85, -35, 55, -18, 28, -8, 0] }, ms: 680 },
  "Audit Logs": { a: { rotate: [0, -200, -90, -180, 0], scale: [1, 0.88, 1.08, 1] }, ms: 700 },
  "Log out": { a: { x: [0, 18, -16, 8, -4, 2, 0], opacity: [1, 0.2, 1, 0.6, 1] }, ms: 580 },
  "Workspaces": { a: { scale: [1, 1.3, 0.82, 1.18, 0.92, 1.06, 1], rotate: [0, 6, -5, 2, 0] }, ms: 620 },
  "Invitations": { a: { y: [0, -6, 2, -3, 1, 0], rotate: [0, -8, 4, -2, 0] }, ms: 500 },
  "CISO Reports": { a: { rotate: [0, 12, -8, 5, -3, 1, 0], scale: [1, 1.08, 0.96, 1.04, 1] }, ms: 520 },
  "Rate Limiting": { a: { rotate: [0, 15, -8, 12, -5, 4, -2, 0], scale: [1, 1.12, 0.94, 1.06, 0.98, 1.02, 1], originX: 0.5, originY: 0.5 }, ms: 550 },
  "Heimdall AI": { a: { scale: [1, 1.25, 0.85, 1.15, 0.95, 1.05, 1], rotate: [0, -8, 12, -5, 3, 0] }, ms: 600 }
};

// ── Nav items (unchanged) ─────────────────────────────────────────────────────
const monitorItems = [
  { title: "Dashboard", url: null, icon: BarChart3, isDynamic: true },
  { title: "Security Hub", url: "/security-hub", icon: Search },
  { title: "Threat Logs", url: "/threat-logs", icon: AlertTriangle },
  { title: "Security Alerts", url: "/security-alerts", icon: Bell },
  { title: "Incidents", url: "/incidents", icon: FileText },
];

const securityItems = [
  { title: "API Endpoints", url: "/api-endpoints", icon: Globe },
  { title: "IP Blacklist", url: "/ip-blacklist", icon: Shield },
  // { title: "Playground", url: "/playground", icon: Code },
  { title: "CISO Reports", url: "/ciso-reports", icon: FileText },
  { title: "Rate Limiting", url: null, icon: Gauge, isDynamic: true },
  //{ title: "Heimdall AI", url: "/heimdall-ai", icon: Sparkles },
];

const SHOW_SOURCE_CODE = false;

const SECURITY_TIPS = [
  "Rotate your API keys every 90 days to limit exposure from credential leaks.",
  "Enable rate limiting on all public endpoints to prevent brute-force attacks.",
  "Always validate and sanitize input server-side — never trust the client.",
  "Use allowlists over blocklists for IP-based access control.",
  "Monitor for unusual traffic spikes — they often precede DDoS attempts.",
  "Disable unused HTTP methods (PUT, DELETE) on endpoints that don't need them.",
  "Set short expiry times on JWT tokens and refresh them silently.",
  "Log every 4xx and 5xx response — anomalies hide in the noise.",
  "Use HSTS headers to prevent protocol downgrade attacks.",
  "Segment your APIs — internal and external endpoints should never share auth.",
];

// ─────────────────────────────────────────────────────────────────────────────
// DIGITAL CLOCK — greeting-first, warm and spacious
// ─────────────────────────────────────────────────────────────────────────────
const DigitalClock = ({ p, collapsed, userName }: { p: any; collapsed: boolean; userName?: string }) => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  const hh = hours.toString().padStart(2, "0");
  const sec = now.getSeconds();

  const hour = now.getHours();
  const greeting = hour < 5 ? "Still up?" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 21 ? "Good evening" : "Good night";
  const firstName = (userName || "User").split(" ")[0];

  // Time-based tech icon — each one different, all SVG, all tech-themed
  const TimeIcon = () => {
    const c = p.accent;
    // 00–04: Moon + terminal cursor (late night coder)
    if (hour < 5) return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M17 13.5A8 8 0 0 1 7.5 3a6.5 6.5 0 1 0 9.5 10.5Z" fill={c} fillOpacity="0.15" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
        <rect x="3" y="15" width="6" height="1.2" rx="0.6" fill={c} fillOpacity="0.5"/>
        <motion.rect x="9.5" y="15" width="1.2" height="1.2" rx="0.3" fill={c} animate={{ opacity:[1,0,1] }} transition={{ duration:0.9, repeat:Infinity, ease:"easeInOut" }}/>
      </svg>
    );
    // 05–07: Sunrise + wifi signal (early dev)
    if (hour < 8) return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M10 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.3"/>
        <path d="M5.5 14.5 Q10 10 14.5 14.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none"/>
        <path d="M3 17 Q10 11 17 17" stroke={c} strokeWidth="1.3" strokeLinecap="round" fill="none" strokeOpacity="0.5"/>
        <line x1="10" y1="3" x2="10" y2="5" stroke={c} strokeWidth="1.4" strokeLinecap="round"/>
        <line x1="4" y1="7" x2="5.5" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6"/>
        <line x1="16" y1="7" x2="14.5" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.6"/>
      </svg>
    );
    // 08–11: CPU / morning work mode
    if (hour < 12) return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="5" y="5" width="10" height="10" rx="2" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.3"/>
        <rect x="7.5" y="7.5" width="5" height="5" rx="1" fill={c} fillOpacity="0.25"/>
        <line x1="8" y1="3" x2="8" y2="5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="12" y1="3" x2="12" y2="5" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="8" y1="15" x2="8" y2="17" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="12" y1="15" x2="12" y2="17" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="3" y1="8" x2="5" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="3" y1="12" x2="5" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="15" y1="8" x2="17" y2="8" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
        <line x1="15" y1="12" x2="17" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    );
    // 12–13: Deploy / lunch push
    if (hour < 14) return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M10 3 L18 7 L18 13 L10 17 L2 13 L2 7 Z" fill={c} fillOpacity="0.1" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
        <path d="M10 3 L10 17" stroke={c} strokeWidth="1" strokeOpacity="0.4"/>
        <path d="M2 7 L10 11 L18 7" stroke={c} strokeWidth="1" strokeOpacity="0.4"/>
        <circle cx="10" cy="11" r="2" fill={c} fillOpacity="0.8"/>
      </svg>
    );
    // 14–16: Terminal / afternoon grind
    if (hour < 17) return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="12" rx="2.5" fill={c} fillOpacity="0.1" stroke={c} strokeWidth="1.3"/>
        <path d="M6 8.5 L8.5 11 L6 13.5" stroke={c} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="10" y1="13.5" x2="14" y2="13.5" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeOpacity="0.7"/>
        <circle cx="5" cy="7" r="0.8" fill={c} fillOpacity="0.5"/>
        <circle cx="7.5" cy="7" r="0.8" fill={c} fillOpacity="0.5"/>
        <circle cx="10" cy="7" r="0.8" fill={c} fillOpacity="0.5"/>
      </svg>
    );
    // 17–20: Code merge / evening wrap-up
    if (hour < 21) return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <circle cx="5" cy="5" r="2" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2"/>
        <circle cx="15" cy="5" r="2" fill={c} fillOpacity="0.2" stroke={c} strokeWidth="1.2"/>
        <circle cx="10" cy="15" r="2" fill={c} fillOpacity="0.3" stroke={c} strokeWidth="1.3"/>
        <path d="M5 7 Q5 12 10 13" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
        <path d="M15 7 Q15 12 10 13" stroke={c} strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      </svg>
    );
    // 21–23: Server / night shift
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="3" y="3" width="14" height="5" rx="1.5" fill={c} fillOpacity="0.12" stroke={c} strokeWidth="1.2"/>
        <rect x="3" y="9" width="14" height="5" rx="1.5" fill={c} fillOpacity="0.08" stroke={c} strokeWidth="1.2" strokeOpacity="0.7"/>
        <circle cx="14" cy="5.5" r="1" fill={c} fillOpacity="0.9"/>
        <circle cx="14" cy="11.5" r="1" fill={c} fillOpacity="0.5"/>
        <line x1="5.5" y1="5.5" x2="10" y2="5.5" stroke={c} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5"/>
        <line x1="5.5" y1="11.5" x2="9" y2="11.5" stroke={c} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4"/>
        <line x1="3" y1="16" x2="17" y2="16" stroke={c} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.25"/>
      </svg>
    );
  };

  const dayStr = now.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const isDark = p.bg === "#15171C";

  if (collapsed) {
    return (
      <div style={{
        margin: "6px 4px 4px", borderRadius: 10, padding: "10px 4px",
        background: isDark ? "rgba(30,58,138,0.35)" : "rgba(37,99,235,0.06)",
        border: `1px solid ${isDark ? "rgba(56,189,248,0.15)" : "rgba(37,99,235,0.1)"}`,
        display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2,
      }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: p.accent, letterSpacing: "0.04em", lineHeight: 1 }}>{hh}</span>
        <motion.span animate={{ opacity: [1, 0.15, 1] }} transition={{ duration: 1, repeat: Infinity }} style={{ color: p.accent, fontSize: 8, lineHeight: 1 }}>:</motion.span>
        <span style={{ fontFamily: "monospace", fontSize: 10, fontWeight: 700, color: p.accent, letterSpacing: "0.04em", lineHeight: 1 }}>{minutes}</span>
      </div>
    );
  }

  return (
    <div style={{
      margin: "6px 4px 4px",
      borderRadius: 18,
      overflow: "hidden",
      position: "relative" as const,
      background: isDark
        ? "linear-gradient(160deg, rgba(15,23,42,0.95) 0%, rgba(20,40,100,0.7) 100%)"
        : "linear-gradient(160deg, rgba(248,250,255,1) 0%, rgba(224,235,255,0.8) 100%)",
      border: `1px solid ${isDark ? "rgba(56,189,248,0.12)" : "rgba(37,99,235,0.1)"}`,
    }}>
      {/* Soft glow top-right */}
      <div style={{
        position: "absolute", right: -30, top: -30, width: 100, height: 100, borderRadius: "50%",
        background: isDark ? "rgba(6,182,212,0.08)" : "rgba(37,99,235,0.06)",
        filter: "blur(30px)", pointerEvents: "none",
      }} />

      <div style={{ position: "relative", padding: "16px 16px 14px" }}>
        {/* Greeting — the hero */}
        <div style={{ marginBottom: 10 }}>
          <div style={{
            fontSize: 11, fontWeight: 500,
            color: isDark ? "rgba(148,163,184,0.7)" : "rgba(100,116,139,0.8)",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.01em",
            marginBottom: 3,
          }}>
            {greeting},
          </div>
          <div style={{
            fontSize: 17, fontWeight: 700,
            color: p.accent,
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "-0.01em",
            lineHeight: 1.15,
            display: "flex", alignItems: "center", gap: 6,
          }}>
            {firstName}
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 24, height: 24, borderRadius: 8, flexShrink: 0,
              background: isDark ? "rgba(56,189,248,0.1)" : "rgba(37,99,235,0.08)",
              border: `1px solid ${isDark ? "rgba(56,189,248,0.18)" : "rgba(37,99,235,0.12)"}`,
            }}>
              <TimeIcon />
            </span>
          </div>
        </div>

        {/* Thin divider */}
        <div style={{
          height: 1, marginBottom: 12,
          background: isDark
            ? "linear-gradient(90deg, transparent, rgba(56,189,248,0.15), transparent)"
            : "linear-gradient(90deg, transparent, rgba(37,99,235,0.1), transparent)",
        }} />

        {/* Time + date row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {/* HH:MM */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
            <span style={{
              fontFamily: "monospace", fontSize: 28, fontWeight: 800,
              color: isDark ? "rgba(248,250,252,0.9)" : "rgba(15,23,42,0.85)",
              letterSpacing: "-0.03em", lineHeight: 1,
            }}>{hh}</span>
            <motion.span
              animate={{ opacity: [1, 0.1, 1] }}
              transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 700, color: p.accent, lineHeight: 1, margin: "0 1px" }}
            >:</motion.span>
            <span style={{
              fontFamily: "monospace", fontSize: 28, fontWeight: 800,
              color: isDark ? "rgba(248,250,252,0.9)" : "rgba(15,23,42,0.85)",
              letterSpacing: "-0.03em", lineHeight: 1,
            }}>{minutes}</span>
            <span style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700,
              color: p.accent, marginLeft: 4, paddingBottom: 2, letterSpacing: "0.06em",
            }}>{ampm}</span>
          </div>

          {/* Date chip — right aligned */}
          <span style={{
            fontSize: 9, fontWeight: 600,
            color: isDark ? "rgba(148,163,184,0.6)" : "rgba(100,116,139,0.7)",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.02em",
            textAlign: "right" as const,
            lineHeight: 1.4,
          }}>
            {dayStr}
          </span>
        </div>

        {/* Seconds progress bar — very minimal */}
        <div style={{ marginTop: 10, height: 1.5, borderRadius: 99, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)", overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${(sec / 59) * 100}%` }}
            transition={{ duration: 0.9, ease: "linear" }}
            style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${p.accent}88, ${p.accent})` }}
          />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY TIP CARD — spacious, readable, feels like a real tip
// ─────────────────────────────────────────────────────────────────────────────
const SecurityTipCard = ({ p, collapsed }: { p: any; collapsed: boolean }) => {
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  const advance = (next: number) => {
    setFading(true);
    setTimeout(() => { setIndex(next); setFading(false); }, 280);
  };

  useEffect(() => {
    const id = setInterval(() => advance((index + 1) % SECURITY_TIPS.length), 15000);
    return () => clearInterval(id);
  }, [index]);

  if (collapsed) return null;

  const isDark = p.bg === "#15171C";

  return (
    <div style={{
      margin: "4px 4px 10px",
      borderRadius: 18,
      overflow: "hidden",
      position: "relative" as const,
      background: isDark
        ? "rgba(15,23,42,0.8)"
        : "rgba(248,250,252,1)",
      border: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.07)"}`,
    }}>
      {/* Left accent stripe */}
      <div style={{
        position: "absolute", left: 0, top: 12, bottom: 12, width: 3, borderRadius: "0 3px 3px 0",
        background: "linear-gradient(180deg, #2563eb, #06b6d4)",
      }} />

      <div style={{ padding: "14px 14px 12px 18px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {/* Lightbulb icon */}
            <div style={{
              width: 18, height: 18, borderRadius: 6, flexShrink: 0,
              background: isDark ? "rgba(56,189,248,0.12)" : "rgba(37,99,235,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                <path d="M10 3C7.24 3 5 5.24 5 8c0 1.85 1 3.47 2.5 4.35V14a.5.5 0 0 0 .5.5h4a.5.5 0 0 0 .5-.5v-1.65C14 11.47 15 9.85 15 8c0-2.76-2.24-5-5-5z" fill={isDark ? "rgba(56,189,248,0.8)" : "rgba(37,99,235,0.7)"} />
                <path d="M8 16h4" stroke={isDark ? "rgba(56,189,248,0.6)" : "rgba(37,99,235,0.5)"} strokeWidth="1.2" strokeLinecap="round" />
              </svg>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800,
              letterSpacing: "0.14em", textTransform: "uppercase" as const,
              fontFamily: "'DM Sans', sans-serif",
              color: isDark ? "rgba(56,189,248,0.55)" : "rgba(37,99,235,0.45)",
            }}>
              Security Tip
            </span>
          </div>

          {/* Counter: 1 / 10 */}
          <span style={{
            fontSize: 9, fontWeight: 700,
            fontFamily: "monospace",
            color: isDark ? "rgba(148,163,184,0.4)" : "rgba(100,116,139,0.45)",
            letterSpacing: "0.08em",
          }}>
            {index + 1}&nbsp;/&nbsp;{SECURITY_TIPS.length}
          </span>
        </div>

        {/* Tip text — the hero */}
        <div style={{
          opacity: fading ? 0 : 1,
          transform: fading ? "translateY(-3px)" : "translateY(0)",
          transition: "opacity 0.28s ease, transform 0.28s ease",
        }}>
          {/* Large quote mark */}
          <div style={{
            fontSize: 32, lineHeight: 0.8, marginBottom: 4, marginLeft: -2,
            fontFamily: "Georgia, serif",
            color: isDark ? "rgba(56,189,248,0.18)" : "rgba(37,99,235,0.12)",
            userSelect: "none",
          }}>"</div>
          <p style={{
            fontSize: 11.5, lineHeight: 1.65, margin: 0,
            color: isDark ? "rgba(203,213,225,0.85)" : "rgba(51,65,85,0.85)",
            fontFamily: "'DM Sans', sans-serif",
            letterSpacing: "0.01em",
          }}>
            {SECURITY_TIPS[index]}
          </p>
        </div>

        {/* Footer: dots + next */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 12 }}>
          {SECURITY_TIPS.map((_, i) => (
            <button
              key={i}
              onClick={() => advance(i)}
              style={{
                width: i === index ? 14 : 4, height: 4,
                borderRadius: 99, border: "none", padding: 0, cursor: "pointer",
                background: i === index
                  ? (isDark ? "rgba(56,189,248,0.7)" : "rgba(37,99,235,0.5)")
                  : (isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)"),
                transition: "width 0.3s cubic-bezier(0.34,1.56,0.64,1), background 0.2s",
                flexShrink: 0,
              }}
            />
          ))}
          <button
            onClick={() => advance((index + 1) % SECURITY_TIPS.length)}
            style={{
              marginLeft: "auto", background: "none", border: "none",
              cursor: "pointer", padding: 0,
              fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              fontFamily: "'DM Sans', sans-serif",
              color: isDark ? "rgba(56,189,248,0.45)" : "rgba(37,99,235,0.4)",
              transition: "color 0.15s",
              display: "flex", alignItems: "center", gap: 3,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(56,189,248,0.9)" : "rgba(37,99,235,0.8)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = isDark ? "rgba(56,189,248,0.45)" : "rgba(37,99,235,0.4)"; }}
          >
            Next
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M1.5 4h5M4 1.5L6.5 4 4 6.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main sidebar (all logic + structure unchanged) ───────────────────────────
const SIDEBAR_STATE_KEY = "heimdall_sidebar_open";

const AppSidebar = () => {
  const { state, open, setOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { hasSelectedPlatform, selectedPlatformId } = usePlatform();
  const collapsed = state === "collapsed";

  // ── Persist sidebar state — initial value set via SidebarProvider defaultOpen ─
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(open));
  }, [open]);
  // ──────────────────────────────────────────────────────────────────────────────

  const [animating, setAnimating] = useState<Record<string, boolean>>({});

  // Collapsed-icon hover tooltip
  const [hoveredNav, setHoveredNav] = useState<{ title: string; y: number } | null>(null);

  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('heimdall_theme');
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const handleThemeChange = () => {
      const saved = localStorage.getItem('heimdall_theme');
      setIsDark(saved === 'dark');
    };
    window.addEventListener('storage', handleThemeChange);
    window.addEventListener('localStorageChange', handleThemeChange);
    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('localStorageChange', handleThemeChange);
    };
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const p = isDark
    ? {
        bg: "#15171C", border: "rgba(255,255,255,0.06)", topBorder: "rgba(255,255,255,0.06)",
        sectionText: "#6B7280", text: "#F8FAFC", muted: "#CBD5E1", icon: "#AEB8C8",
        iconActive: "#60A5FA", activeBg: "rgba(37,99,235,0.16)", hoverBg: "rgba(255,255,255,0.04)",
        accent: "#38BDF8", popupBg: "#15171C", popupBorder: "rgba(255,255,255,0.08)",
      }
    : {
        bg: "#FFFFFF", border: "rgba(37,99,235,0.08)", topBorder: "rgba(37,99,235,0.06)",
        sectionText: "#94A3B8", text: "#0F172A", muted: "#475569", icon: "#94A3B8",
        iconActive: "#2563EB", activeBg: "rgba(37,99,235,0.08)", hoverBg: "rgba(37,99,235,0.04)",
        accent: "#2563EB", popupBg: "#FFFFFF", popupBorder: "rgba(15,23,42,0.08)",
      };

  const handleLogout = async () => { try { await logout(); } catch {} };

  const fire = useCallback((title: string) => {
    const cfg = ANIM[title];
    if (!cfg) return;
    setAnimating((prev) => ({ ...prev, [title]: true }));
    setTimeout(() => setAnimating((prev) => ({ ...prev, [title]: false })), cfg.ms + 80);
  }, []);

  const AnimIcon = ({ Icon, active, title }: { Icon: ElementType; active: boolean; title: string }) => {
    const cfg = ANIM[title];
    const on = !!animating[title];
    return (
      <motion.div
        animate={on && cfg ? cfg.a : {}}
        transition={on && cfg ? { duration: cfg.ms / 1000, ease: "easeInOut" } : {}}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <Icon style={{ width: 15, height: 15, color: active ? p.iconActive : p.icon, transition: "color 0.15s ease" }} />
      </motion.div>
    );
  };

  const NavItem = ({ title, url, icon: Icon, isDynamic }: any) => {
    let finalUrl = url || "#";
    if (isDynamic && selectedPlatformId) {
      if (title === "Dashboard") finalUrl = `/platforms/${selectedPlatformId}`;
      else if (title === "Rate Limiting") finalUrl = `/workspace/${selectedPlatformId}/rate-limiting`;
      else finalUrl = url ? `/platforms/${selectedPlatformId}${url}` : "#";
    }
    const active = isDynamic && selectedPlatformId
      ? location.pathname === finalUrl
      : location.pathname === url;

    return (
      <SidebarMenuItem style={{ listStyle: "none" }}>
        <SidebarMenuButton asChild>
          <NavLink
            to={finalUrl}
            end
            onClick={() => fire(title)}
            style={{
              display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "9px 0" : "9px 12px",
              borderRadius: 10, border: "none", textDecoration: "none", cursor: "pointer",
              background: active ? p.activeBg : "transparent",
              transition: "background 0.15s ease", width: "100%",
            }}
            onMouseEnter={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = p.hoverBg;
              if (collapsed) {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                // Use icon center: 9px top-padding + 7.5px (half of 15px icon height)
                setHoveredNav({ title, y: rect.top + 9 + 7.5 });
              }
            }}
            onMouseLeave={(e) => {
              if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              setHoveredNav(null);
            }}
          >
            <AnimIcon Icon={Icon} active={active} title={title} />
            {!collapsed && (
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: active ? 600 : 500, color: active ? p.text : p.muted, letterSpacing: "0.3px", whiteSpace: "nowrap" }}>
                {title}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const SectionLabel = ({ label }: { label: string }) =>
    collapsed ? null : (
      <div style={{ padding: "8px 12px 4px", fontFamily: "'DM Sans', monospace", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", color: p.sectionText, textTransform: "uppercase" }}>
        {label}
      </div>
    );

  const SidebarBottom = () => (
    <div style={{ marginTop: "auto", paddingTop: 8 }}>
      <DigitalClock p={p} collapsed={collapsed} userName={user?.first_name || user?.email?.split('@')[0] || "User"} />
      <SecurityTipCard p={p} collapsed={collapsed} />
    </div>
  );

  const brandHeader = (
    <div style={{ padding: collapsed ? "12px 0" : "14px 14px", borderBottom: `1px solid ${p.topBorder}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 10, minHeight: 60, background: p.bg }}>
      {collapsed ? (
        <SidebarTrigger style={{ color: p.muted }} />
      ) : (
        <>
          <NavLink to="/" style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, opacity: collapsed ? 0 : 1, transition: "opacity 0.2s ease", textDecoration: "none" }}>
            <HeimdallAILogo size={32} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: p.text, letterSpacing: "-0.01em" }}>Heimdall</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: p.accent, marginTop: 2, letterSpacing: "0.45px" }}>by Smartcomply</div>
            </div>
          </NavLink>
          <SidebarTrigger style={{ color: p.muted, flexShrink: 0 }} />
        </>
      )}
    </div>
  );

  // ── Hover tooltip portal (renders outside sidebar to escape overflow clipping) ─
  const NavTooltip = collapsed && hoveredNav
    ? createPortal(
        <motion.div
          key={hoveredNav.title}
          initial={{ opacity: 0, x: -10, scale: 0.92 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -10, scale: 0.92 }}
          transition={{ type: "spring", stiffness: 460, damping: 26, mass: 0.6 }}
          style={{
            position: "fixed",
            left: 58,
            top: hoveredNav.y,
            transform: "translateY(-50%)",
            zIndex: 99999,
            pointerEvents: "none",
          }}
        >
          <div style={{
            padding: "5px 10px 5px 8px",
            borderRadius: 9,
            fontSize: 12,
            fontWeight: 600,
            lineHeight: 1,
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap" as const,
            display: "flex",
            alignItems: "center",
            background: isDark ? "rgba(15,23,42,0.95)" : "rgba(255,255,255,0.97)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.1)"}`,
            color: isDark ? "#F8FAFC" : "#0F172A",
            boxShadow: isDark
              ? "0 8px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset"
              : "0 8px 24px rgba(15,23,42,0.12), 0 1px 0 rgba(255,255,255,0.8) inset",
          }}>
            {hoveredNav.title}
          </div>
        </motion.div>,
        document.body
      )
    : null;

  if (!hasSelectedPlatform) {
    return (
      <>
        <Sidebar className={`${collapsed ? "w-20" : "w-56"} transition-all duration-300`} collapsible="icon"
          style={{ borderRight: `1px solid ${p.border}`, background: p.bg }}
          onMouseLeave={() => setHoveredNav(null)}>
          {brandHeader}
          <SidebarContent style={{ padding: collapsed ? "8px 6px" : "8px 8px", overflowX: "hidden", background: p.bg, display: "flex", flexDirection: "column" }}>
            <SidebarGroup style={{ padding: 0, marginBottom: 6 }}>
              <SectionLabel label="WORKSPACES" />
              <SidebarGroupContent>
                <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <NavItem title="Workspaces" url="/platforms" icon={Shield} />
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarBottom />
          </SidebarContent>
        </Sidebar>
        {NavTooltip}
      </>
    );
  }

  return (
    <>
    <Sidebar className={`${collapsed ? "w-20" : "w-56"} transition-all duration-300`} collapsible="icon"
      style={{ borderRight: `1px solid ${p.border}`, background: p.bg }}
      onMouseLeave={() => setHoveredNav(null)}>

      {brandHeader}

      <SidebarContent style={{ padding: collapsed ? "8px 6px" : "8px 8px", overflowX: "hidden", background: p.bg, display: "flex", flexDirection: "column" }}>
        {/* MONITOR */}
        <SidebarGroup style={{ padding: 0, marginBottom: 6 }}>
          <SectionLabel label="MONITOR" />
          <SidebarGroupContent>
            <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {monitorItems.map((item) => <NavItem key={item.title} {...item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* SECURITY */}
        <SidebarGroup style={{ padding: 0, marginBottom: 6 }}>
          <SectionLabel label="SECURITY" />
          <SidebarGroupContent>
            <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {securityItems.map((item) => <NavItem key={item.title} {...item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Clock + Tips pushed to bottom */}
        <SidebarBottom />
      </SidebarContent>
    </Sidebar>
    {NavTooltip}
    </>
  );
};

export default AppSidebar;
