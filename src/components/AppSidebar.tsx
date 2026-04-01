import type { ElementType } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Shield,
  AlertTriangle,
  Globe,
  Settings,
  Users,
  Code,
  LogOut,
  Search,
  Clock,
  FileText,
  LayoutDashboard,
  Link2,
  BookOpen,
  Bell,
  BarChart3,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatform } from "@/contexts/PlatformContext";

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
];

const sourceCodeItems = [
  { title: "Dashboard", url: "/code-review-dashboard", icon: LayoutDashboard },
  { title: "Connect Repo", url: "/code-review-connect", icon: Link2 },
  { title: "Repositories", url: "/code-review-repos", icon: BookOpen },
  { title: "Scan Reports", url: "/code-review-scan-reports", icon: FileText },
  { title: "Git Auto Scan", url: "/git-automated-scan", icon: Clock },
];

const settingItems = [
  { title: "Users & Teams", url: "/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Audit Logs", url: "/audit-logs", icon: Clock },
];

const AppSidebar = ({ isDark = false }: { isDark?: boolean }) => {
  const { state } = useSidebar();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { hasSelectedPlatform, selectedPlatformId } = usePlatform();
  const collapsed = state === "collapsed";


  const palette = isDark
    ? {
        sidebarBg: "#15171C",
        sidebarBorder: "rgba(255,255,255,0.06)",
        topBorder: "rgba(255,255,255,0.06)",
        sectionText: "#6B7280",
        text: "#F8FAFC",
        mutedText: "#CBD5E1",
        dimText: "#94A3B8",
        icon: "#AEB8C8",
        iconActive: "#60A5FA",
        itemActiveBg: "rgba(37,99,235,0.16)",
        itemHoverBg: "rgba(255,255,255,0.04)",
        logoutHoverBg: "rgba(239,68,68,0.08)",
        brandAccent: "#38BDF8",
      }
    : {
        sidebarBg: "#FFFFFF",
        sidebarBorder: "rgba(37,99,235,0.08)",
        topBorder: "rgba(37,99,235,0.06)",
        sectionText: "#94A3B8",
        text: "#0F172A",
        mutedText: "#475569",
        dimText: "#94A3B8",
        icon: "#94A3B8",
        iconActive: "#2563EB",
        itemActiveBg: "rgba(37,99,235,0.08)",
        itemHoverBg: "rgba(37,99,235,0.04)",
        logoutHoverBg: "rgba(239,68,68,0.06)",
        brandAccent: "#2563EB",
      };

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* handled */
    }
  };

  const NavItem = ({
    title,
    url,
    icon: Icon,
    isDynamic = false,
  }: {
    title: string;
    url: string | null;
    icon: ElementType;
    isDynamic?: boolean;
  }) => {
    const resolvedUrl =
      isDynamic && selectedPlatformId ? `/platforms/${selectedPlatformId}` : url || "#";
    const active =
      isDynamic && selectedPlatformId
        ? location.pathname === `/platforms/${selectedPlatformId}`
        : isActive(url || "");

    return (
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <NavLink
            to={resolvedUrl}
            end={resolvedUrl === "/"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: collapsed ? 0 : 10,
              padding: collapsed ? "10px 0" : "9px 12px",
              borderRadius: 10,
              textDecoration: "none",
              transition: "background 0.15s ease, color 0.15s ease",
              background: active ? palette.itemActiveBg : "transparent",
              justifyContent: collapsed ? "center" : "flex-start",
              width: "100%",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = palette.itemHoverBg;
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
              }
            }}
          >
            {!collapsed && (
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: active ? palette.iconActive : "transparent",
                  boxShadow: active
                    ? `0 0 8px ${isDark ? "rgba(96,165,250,0.55)" : "rgba(37,99,235,0.45)"}`
                    : "none",
                  transition: "all 0.15s ease",
                }}
              />
            )}

            <Icon
              style={{
                width: 15,
                height: 15,
                flexShrink: 0,
                color: active ? palette.iconActive : palette.icon,
                transition: "color 0.15s ease",
              }}
            />

            {!collapsed && (
              <span
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: active ? 600 : 500,
                  color: active ? palette.text : palette.mutedText,
                  transition: "color 0.15s ease",
                  whiteSpace: "nowrap",
                }}
              >
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
      <div
        style={{
          fontFamily: "'Sora', monospace",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          color: palette.sectionText,
          padding: "16px 12px 6px",
          userSelect: "none",
        }}
      >
        {label}
      </div>
    );

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-56"} transition-all duration-300`}
      collapsible="icon"
      style={{
        borderRight: `1px solid ${palette.sidebarBorder}`,
        background: palette.sidebarBg,
      }}
    >
      <div
        style={{
          padding: collapsed ? "12px 0" : "14px 14px",
          borderBottom: `1px solid ${palette.topBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 10,
          minHeight: 60,
          background: palette.sidebarBg,
        }}
      >
        {!collapsed && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                flexShrink: 0,
                background: "linear-gradient(135deg,#2563EB,#0EA5E9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 20px rgba(37,99,235,.28)",
              }}
            >
              <Shield style={{ width: 18, height: 18, color: "white" }} />
            </div>

            <div style={{ lineHeight: 1.15 }}>
              <div
                style={{
                  fontFamily: "'Sora',sans-serif",
                  fontSize: 14,
                  fontWeight: 700,
                  color: palette.text,
                  letterSpacing: "-0.01em",
                }}
              >
                Heimdall
              </div>
              <div
                style={{
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: 10,
                  fontWeight: 600,
                  color: palette.brandAccent,
                }}
              >
                by Smartcomply
              </div>
            </div>
          </div>
        )}

        <SidebarTrigger
          style={{
            color: palette.mutedText,
            flexShrink: 0,
          }}
        />
      </div>

      <SidebarContent
        style={{
          padding: collapsed ? "4px 6px" : "4px 8px",
          overflowX: "hidden",
          background: palette.sidebarBg,
        }}
      >
        {hasSelectedPlatform && (
          <SidebarGroup style={{ padding: 0 }}>
            <SectionLabel label="MONITOR" />
            <SidebarGroupContent>
              <SidebarMenu>
                {monitorItems.map((item) => (
                  <NavItem key={item.title} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasSelectedPlatform && (
          <SidebarGroup style={{ padding: 0 }}>
            <SectionLabel label="SECURITY" />
            <SidebarGroupContent>
              <SidebarMenu>
                {securityItems.map((item) => (
                  <NavItem key={item.title} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {hasSelectedPlatform && (
          <SidebarGroup style={{ padding: 0 }}>
            <SectionLabel label="SOURCE CODE" />
            <SidebarGroupContent>
              <SidebarMenu>
                {sourceCodeItems.map((item) => (
                  <NavItem key={item.title} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup style={{ padding: 0 }}>
          <SectionLabel label="SETTINGS" />
          <SidebarGroupContent>
            <SidebarMenu>
              {!hasSelectedPlatform && (
                <NavItem title="Workspaces" url="/platforms" icon={Shield} />
              )}
              {settingItems.map((item) => (
                <NavItem key={item.title} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup
          style={{
            marginTop: "auto",
            padding: 0,
            paddingTop: 10,
            borderTop: `1px solid ${palette.topBorder}`,
          }}
        >
          <SidebarGroupContent>
            {!collapsed && user && (
              <div style={{ padding: "8px 12px 4px" }}>
                <div
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: palette.text,
                  }}
                >
                  {user.first_name} {user.last_name}
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans',sans-serif",
                    fontSize: 11,
                    color: palette.dimText,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.email}
                </div>
              </div>
            )}

            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    onClick={handleLogout}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: collapsed ? 0 : 10,
                      padding: collapsed ? "10px 0" : "9px 12px",
                      width: "100%",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      borderRadius: 10,
                      justifyContent: collapsed ? "center" : "flex-start",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        palette.logoutHoverBg;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.background =
                        "transparent";
                    }}
                  >
                    <LogOut
                      style={{
                        width: 15,
                        height: 15,
                        color: palette.icon,
                        flexShrink: 0,
                      }}
                    />
                    {!collapsed && (
                      <span
                        style={{
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: 13,
                          color: palette.mutedText,
                          fontWeight: 500,
                        }}
                      >
                        Logout
                      </span>
                    )}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
