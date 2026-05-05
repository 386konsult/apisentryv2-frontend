import type { ElementType } from "react";
import { useState, useCallback, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Shield, AlertTriangle, Globe, Settings, Users, Code, LogOut,
  Search, Clock, FileText, LayoutDashboard, Link2, BookOpen, Bell, BarChart3, Mail, Gauge,
} from "lucide-react";
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

// Unique click animations
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
  "Rate Limiting": { a: { rotate: [0, 15, -8, 12, -5, 4, -2, 0], scale: [1, 1.12, 0.94, 1.06, 0.98, 1.02, 1], originX: 0.5, originY: 0.5 }, ms: 550 }
};

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
  { title: "Playground", url: "/playground", icon: Code },
  { title: "CISO Reports", url: "/ciso-reports", icon: FileText },
  { title: "Rate Limiting", url: null, icon: Gauge, isDynamic: true },
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

// ─── Live digital clock with dynamic greeting ───────────────────────────────
// ─── Live digital clock with 12‑hour format, larger size & AM/PM (no timezone) ──
const DigitalClock = ({ p, collapsed, userName }: { p: any; collapsed: boolean; userName?: string }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // 12‑hour format
  let hours = now.getHours();
  const minutes = now.getMinutes().toString().padStart(2, "0");
  const seconds = now.getSeconds().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12; // convert 0 → 12
  const hh = hours.toString().padStart(2, "0");

  const hour = now.getHours();

  // Greeting logic
  let greeting = "";
  if (hour >= 5 && hour < 12) greeting = "Good morning";
  else if (hour >= 12 && hour < 17) greeting = "Good afternoon";
  else if (hour >= 17 && hour < 21) greeting = "Good evening";
  else greeting = "Welcome back";

  const displayName = userName || "User";

  if (collapsed) {
    return (
      <div style={{
        margin: "6px 4px 4px",
        borderRadius: 10,
        padding: "8px 4px",
        background: p.hoverBg,
        border: `1px solid ${p.border}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}>
        <span style={{
          fontFamily: "'DM Mono', 'Courier New', monospace",
          fontSize: 9,
          fontWeight: 700,
          color: p.accent,
          letterSpacing: "0.05em",
        }}>{hh}</span>
        <span style={{ color: p.muted, fontSize: 8 }}>:</span>
        <span style={{
          fontFamily: "'DM Mono', 'Courier New', monospace",
          fontSize: 9,
          fontWeight: 700,
          color: p.accent,
          letterSpacing: "0.05em",
        }}>{minutes}</span>
      </div>
    );
  }

  return (
    <div style={{
      margin: "6px 4px 4px",
      borderRadius: 14,
      padding: "12px 14px",
      background: p.hoverBg,
      border: `1px solid ${p.border}`,
    }}>
      {/* Greeting line */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: p.accent,
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: "0.02em",
        marginBottom: 6,
      }}>
        {greeting}, {displayName}
      </div>
      {/* Time row – bigger, no timezone */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
        <span style={{
          fontFamily: "'DM Mono', 'Courier New', monospace",
          fontSize: 28,
          fontWeight: 700,
          color: p.accent,
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}>
          {hh}<span style={{ opacity: 0.45, fontSize: 24 }}>:</span>{minutes}
        </span>
        <span style={{
          fontFamily: "'DM Mono', 'Courier New', monospace",
          fontSize: 13,
          fontWeight: 600,
          color: p.muted,
          letterSpacing: "0.04em",
          marginLeft: 2,
        }}>
          <span style={{ opacity: 0.55 }}>:</span>{seconds}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: p.accent,
          marginLeft: 6,
          letterSpacing: "0.05em",
        }}>
          {ampm}
        </span>
      </div>
    </div>
  );
};

// ─── Rotating security tip card ───────────────────────────────────────────────
const SecurityTipCard = ({ p, collapsed }: { p: any; collapsed: boolean }) => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      // fade out → swap → fade in
      setVisible(false);
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % SECURITY_TIPS.length);
        setVisible(true);
      }, 350);
    }, 15000);
    return () => clearInterval(id);
  }, []);

  if (collapsed) return null;

  return (
    <div style={{
      margin: "4px 4px 10px",
      borderRadius: 14,
      padding: "12px",
      background: p.hoverBg,
      border: `1px solid ${p.border}`,
      minHeight: 90,
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 7 }}>
        <div style={{
          width: 20, height: 20, borderRadius: 6, flexShrink: 0,
          background: "linear-gradient(135deg, #1e3a8a, #06b6d4)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
            <path d="M10 2 L16 5 L16 10 C16 13.5 13 16.5 10 18 C7 16.5 4 13.5 4 10 L4 5 Z"
              fill="white" fillOpacity="0.9" />
            <rect x="9" y="8.5" width="2" height="4.5" rx="1" fill="#06b6d4" />
            <circle cx="10" cy="7" r="1" fill="#06b6d4" />
          </svg>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, color: p.accent,
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: "0.08em", textTransform: "uppercase" as const,
          flex: 1,
        }}>
          Security Tip
        </span>
        {/* Dot indicators */}
        <div style={{ display: "flex", gap: 3 }}>
          {SECURITY_TIPS.map((_, i) => (
            <div
              key={i}
              onClick={() => { setVisible(false); setTimeout(() => { setIndex(i); setVisible(true); }, 200); }}
              style={{
                width: i === index ? 12 : 5,
                height: 5,
                borderRadius: 999,
                background: i === index ? p.accent : `${p.accent}40`,
                transition: "width 0.3s ease, background 0.3s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* Tip text — crossfade */}
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -4 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{
            fontSize: 10.5, color: p.muted,
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.55, margin: 0,
          }}
        >
          {SECURITY_TIPS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

// ─── Main sidebar ─────────────────────────────────────────────────────────────
const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { hasSelectedPlatform, selectedPlatformId } = usePlatform();
  const collapsed = state === "collapsed";

  const [animating, setAnimating] = useState<Record<string, boolean>>({});

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

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

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
            title={collapsed ? title : ""}
            style={{
              display: "flex", alignItems: "center", gap: collapsed ? 0 : 10,
              justifyContent: collapsed ? "center" : "flex-start",
              padding: collapsed ? "9px 0" : "9px 12px",
              borderRadius: 10, border: "none", textDecoration: "none", cursor: "pointer",
              background: active ? p.activeBg : "transparent",
              transition: "background 0.15s ease",
              width: "100%",
            }}
            onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = p.hoverBg; }}
            onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
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

  if (!hasSelectedPlatform) {
    return (
      <Sidebar className={`${collapsed ? "w-20" : "w-56"} transition-all duration-300`} collapsible="icon"
        style={{ borderRight: `1px solid ${p.border}`, background: p.bg }}>
        <div style={{ padding: collapsed ? "12px 0" : "14px 14px", borderBottom: `1px solid ${p.topBorder}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 10, minHeight: 60, background: p.bg }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", lineHeight: 1.2, flex: 1 }}>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: p.text, letterSpacing: "-0.01em" }}>Heimdall</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: p.accent, marginTop: 2, letterSpacing: "0.45px" }}>by Smartcomply</div>
              </div>
            </div>
          )}
          <SidebarTrigger style={{ color: p.muted, flexShrink: 0 }} />
        </div>
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
    );
  }

  return (
    <Sidebar className={`${collapsed ? "w-20" : "w-56"} transition-all duration-300`} collapsible="icon"
      style={{ borderRight: `1px solid ${p.border}`, background: p.bg }}>

      {/* Brand */}
      <div style={{ padding: collapsed ? "12px 0" : "14px 14px", borderBottom: `1px solid ${p.topBorder}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", gap: 10, minHeight: 60, background: p.bg }}>
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", lineHeight: 1.2, flex: 1 }}>
            <div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 700, color: p.text, letterSpacing: "-0.01em" }}>Heimdall</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: p.accent, marginTop: 2, letterSpacing: "0.45px" }}>by Smartcomply</div>
            </div>
          </div>
        )}
        <SidebarTrigger style={{ color: p.muted, flexShrink: 0 }} />
      </div>

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
  );
};

export default AppSidebar;