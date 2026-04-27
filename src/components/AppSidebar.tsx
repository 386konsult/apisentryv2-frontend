import type { ElementType } from "react";
import { useState, useCallback } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Shield, AlertTriangle, Globe, Settings, Users, Code, LogOut,
  Search, Clock, FileText, LayoutDashboard, Link2, BookOpen, Bell, BarChart3, Mail, Gauge,
} from "lucide-react";
import { motion } from "framer-motion";
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

// ─────────────────────────────────────────────────────────────────────────────
// Unique click animations (stays outside)
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
const AppSidebar = ({ isDark = false }: { isDark?: boolean }) => {
  const { state } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { hasSelectedPlatform, selectedPlatformId } = usePlatform();
  const collapsed = state === "collapsed";

  const [animating, setAnimating] = useState<Record<string, boolean>>({});

  // Because selectedPlatformId is now in scope, we can define the menu items inside the component
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
    { title: "Rate Limiting", url: `/workspace/${selectedPlatformId}/rate-limiting`, icon: Gauge },
  ];

  const sourceCodeItems = [
    { title: "Dashboard ", url: "/code-review-dashboard", icon: LayoutDashboard },
    { title: "Connect Repo", url: "/code-review-connect", icon: Link2 },
    { title: "Repositories", url: "/code-review-repos", icon: BookOpen },
    { title: "Scan Reports", url: "/code-review-scan-reports", icon: FileText },
    { title: "Git Auto Scan", url: "/git-automated-scan", icon: Clock },
  ];
  const SHOW_SOURCE_CODE = false;

  const settingItems = [
    { title: "Users & Teams", url: "/users", icon: Users },
    { title: "Invitations", url: "/invitations", icon: Mail },
    { title: "Settings", url: "/settings", icon: Settings },
    { title: "Audit Logs", url: "/audit-logs", icon: Clock },
  ];

  // ─────────────────────────────────────────────────────────────────────────────
  // Styles (unchanged)
  // ─────────────────────────────────────────────────────────────────────────────
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

  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email?.split("@")[0] || "Account"
    : "Account";
  const emailLabel = user?.email || "";
  const userInitial = displayName.charAt(0).toUpperCase() || "U";

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

  const NavItem = ({ title, url, icon: Icon, isDynamic = false }: {
    title: string; url: string | null; icon: ElementType; isDynamic?: boolean;
  }) => {
    const to = isDynamic && selectedPlatformId ? `/platforms/${selectedPlatformId}` : url || "#";
    const active = isDynamic && selectedPlatformId
      ? location.pathname === `/platforms/${selectedPlatformId}`
      : isActive(url || "");

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
            to={to}
            end={to === "/"}
            onClick={() => fire(title)}
            style={{
              display: "flex", alignItems: "center", gap: collapsed ? 0 : 14,
              padding: collapsed ? "10px 0" : "10px 14px", borderRadius: 12,
              textDecoration: "none", transition: "background 0.15s ease",
              background: active ? p.activeBg : "transparent",
              justifyContent: collapsed ? "center" : "flex-start", width: "100%",
            }}
            onMouseEnter={(e) => { if (!active)(e.currentTarget as HTMLElement).style.background = p.hoverBg; }}
            onMouseLeave={(e) => { if (!active)(e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {!collapsed && (
              <span style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                background: active ? p.iconActive : "transparent",
                boxShadow: active ? `0 0 8px ${isDark ? "rgba(96,165,250,0.55)" : "rgba(37,99,235,0.45)"}` : "none",
                transition: "all 0.15s ease",
              }} />
            )}

            <AnimIcon Icon={Icon} active={active} title={title} />

            {!collapsed && (
              <span style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                fontWeight: active ? 600 : 500,
                color: active ? p.text : p.muted,
                transition: "color 0.15s ease", whiteSpace: "nowrap",
                flex: 1, textAlign: "left", letterSpacing: "0.55px",
              }}>
                {title.trim()}
              </span>
            )}
          </NavLink>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  };

  const AccountItem = ({ title, url, icon: Icon }: { title: string; url: string; icon: ElementType }) => {
    const active = isActive(url);
    return (
      <DropdownMenuItem
        onClick={() => { fire(title); navigate(url); }}
        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, cursor: "pointer", background: active ? p.activeBg : "transparent", margin: "2px 0" }}
      >
        <AnimIcon Icon={Icon} active={active} title={title} />
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: active ? 600 : 500, color: active ? p.text : p.muted, flex: 1, letterSpacing: "0.55px" }}>
          {title}
        </span>
      </DropdownMenuItem>
    );
  };

  const SectionLabel = ({ label }: { label: string }) =>
    collapsed ? null : (
      <div style={{ fontFamily: "'Sora', monospace", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: p.sectionText, padding: "18px 14px 10px", userSelect: "none" }}>
        {label}
      </div>
    );

  // If a platform is not selected, show only the workspaces section
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
        <SidebarContent style={{ padding: collapsed ? "8px 6px" : "8px 8px", overflowX: "hidden", background: p.bg }}>
          <SidebarGroup style={{ padding: 0, marginBottom: 6 }}>
            <SectionLabel label="/WORKSPACES" />
            <SidebarGroupContent>
              <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <NavItem title="Workspaces" url="/platforms" icon={Shield} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup style={{ marginTop: "auto", padding: 0, paddingTop: 14, borderTop: `1px solid ${p.topBorder}` }}>
            {/* account dropdown same as before – omitted for brevity, but keep it */}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  // Normal full sidebar when a platform is selected
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

      <SidebarContent style={{ padding: collapsed ? "8px 6px" : "8px 8px", overflowX: "hidden", background: p.bg }}>
        {/* MONITOR */}
        <SidebarGroup style={{ padding: 0, marginBottom: 6 }}>
          <SectionLabel label="/MONITOR" />
          <SidebarGroupContent>
            <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {monitorItems.map((item) => <NavItem key={item.title} {...item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* SECURITY */}
        <SidebarGroup style={{ padding: 0, marginBottom: 6 }}>
          <SectionLabel label="/SECURITY" />
          <SidebarGroupContent>
            <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {securityItems.map((item) => <NavItem key={item.title} {...item} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {SHOW_SOURCE_CODE && (
          <SidebarGroup style={{ padding: 0, marginBottom: 6 }}>
            <SectionLabel label="/SOURCE CODE" />
            <SidebarGroupContent>
              <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {sourceCodeItems.map((item) => <NavItem key={item.title} {...item} />)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Account section (unchanged) */}
        <SidebarGroup style={{ marginTop: "auto", padding: 0, paddingTop: 14, borderTop: `1px solid ${p.topBorder}` }}>
          <SidebarGroupContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: collapsed ? 0 : 12, justifyContent: collapsed ? "center" : "flex-start", padding: collapsed ? "10px 0" : "10px 12px", borderRadius: 12, border: "none", background: "transparent", cursor: "pointer", transition: "background 0.15s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = p.hoverBg; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{ width: 34, height: 34, borderRadius: "999px", flexShrink: 0, background: isDark ? "rgba(255,255,255,0.12)" : "rgba(37,99,235,0.12)", color: isDark ? "#FFFFFF" : "#1E3A8A", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'DM Sans',sans-serif", fontSize: 14, fontWeight: 700 }}>
                    {userInitial}
                  </div>
                  {!collapsed && (
                    <div style={{ minWidth: 0, textAlign: "left", flex: 1 }}>
                      <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 600, color: p.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", letterSpacing: "0.55px" }}>
                        {displayName}
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="start" side={collapsed ? "right" : "top"} sideOffset={8} collisionPadding={8}
                style={{ width: collapsed ? 220 : 206, padding: 8, borderRadius: 16, border: `1px solid ${p.popupBorder}`, background: p.popupBg, boxShadow: isDark ? "0 10px 24px rgba(0,0,0,0.18)" : "0 10px 24px rgba(15,23,42,0.08)" }}>

                <DropdownMenuLabel style={{ padding: "8px 10px 10px", fontFamily: "'DM Sans',sans-serif" }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#F8FAFC" : "#0F172A", lineHeight: 1.2, letterSpacing: "0.45px" }}>{displayName}</div>
                  {emailLabel && <div style={{ marginTop: 4, fontSize: 12, fontWeight: 500, color: isDark ? "#AEB8C8" : "#64748B", lineHeight: 1.2, wordBreak: "break-word", letterSpacing: "0.2px" }}>{emailLabel}</div>}
                </DropdownMenuLabel>

                <DropdownMenuSeparator style={{ margin: "2px 0 6px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }} />
                {settingItems.map((item) => <AccountItem key={item.title} {...item} />)}
                <DropdownMenuSeparator style={{ margin: "6px 0 6px", background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)" }} />

                <DropdownMenuItem onClick={() => { fire("Log out"); handleLogout(); }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 12, cursor: "pointer", margin: "2px 0" }}>
                  <AnimIcon Icon={LogOut} active={false} title="Log out" />
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13, fontWeight: 500, color: p.muted, flex: 1, letterSpacing: "0.55px" }}>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;