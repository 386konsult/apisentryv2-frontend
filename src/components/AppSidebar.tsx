import type { ElementType } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const navigate = useNavigate();
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
        accountPopupBg: "#15171C",
        accountPopupBorder: "rgba(255,255,255,0.08)",
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
        accountPopupBg: "#FFFFFF",
        accountPopupBorder: "rgba(15,23,42,0.08)",
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

  const displayName = user
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
      user.email?.split("@")[0] ||
      "Account"
    : "Account";

  const emailLabel = user?.email || "";
  const userInitial = displayName.charAt(0).toUpperCase() || "U";

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
              padding: collapsed ? "11px 0" : "11px 12px",
              borderRadius: 12,
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

  const AccountMenuItem = ({
    title,
    url,
    icon: Icon,
  }: {
    title: string;
    url: string;
    icon: ElementType;
  }) => {
    const active = isActive(url);

    return (
      <DropdownMenuItem
        onClick={() => navigate(url)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 12px",
          borderRadius: 12,
          cursor: "pointer",
          background: active ? palette.itemActiveBg : "transparent",
          margin: "2px 0",
        }}
      >
        <Icon
          style={{
            width: 15,
            height: 15,
            flexShrink: 0,
            color: active ? palette.iconActive : palette.icon,
          }}
        />
        <span
          style={{
            fontFamily: "'DM Sans',sans-serif",
            fontSize: 14,
            fontWeight: active ? 600 : 500,
            color: active ? palette.text : palette.mutedText,
          }}
        >
          {title}
        </span>
      </DropdownMenuItem>
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
          padding: "20px 12px 10px",
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
          padding: collapsed ? "8px 6px" : "8px 8px",
          overflowX: "hidden",
          background: palette.sidebarBg,
        }}
      >
        {hasSelectedPlatform && (
          <SidebarGroup style={{ padding: 0 }}>
            <SectionLabel label="MONITOR" />
            <SidebarGroupContent>
              <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
              <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
              <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {sourceCodeItems.map((item) => (
                  <NavItem key={item.title} {...item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {!hasSelectedPlatform && (
          <SidebarGroup style={{ padding: 0 }}>
            <SectionLabel label="SETTINGS" />
            <SidebarGroupContent>
              <SidebarMenu style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <NavItem title="Workspaces" url="/platforms" icon={Shield} />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup
          style={{
            marginTop: "auto",
            padding: 0,
            paddingTop: 14,
            borderTop: `1px solid ${palette.topBorder}`,
          }}
        >
          <SidebarGroupContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: collapsed ? 0 : 12,
                    justifyContent: collapsed ? "center" : "flex-start",
                    padding: collapsed ? "10px 0" : "12px 12px",
                    borderRadius: 12,
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = palette.itemHoverBg;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "999px",
                      flexShrink: 0,
                      background: isDark ? "rgba(255,255,255,0.12)" : "rgba(37,99,235,0.12)",
                      color: isDark ? "#FFFFFF" : "#1E3A8A",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {userInitial}
                  </div>

                  {!collapsed && (
                    <div
                      style={{
                        minWidth: 0,
                        textAlign: "left",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'DM Sans',sans-serif",
                          fontSize: 14,
                          fontWeight: 600,
                          color: palette.text,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {displayName}
                      </div>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align={collapsed ? "start" : "start"}
                side={collapsed ? "right" : "top"}
                sideOffset={8}
                collisionPadding={8}
                style={{
                  width: collapsed ? 220 : 206,
                  padding: 8,
                  borderRadius: 16,
                  border: `1px solid ${palette.accountPopupBorder}`,
                  background: palette.accountPopupBg,
                  boxShadow: isDark
                    ? "0 10px 24px rgba(0,0,0,0.18)"
                    : "0 10px 24px rgba(15,23,42,0.08)",
                }}
              >
                <DropdownMenuLabel
                  style={{
                    padding: "8px 10px 10px",
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: isDark ? "#F8FAFC" : "#0F172A",
                      lineHeight: 1.2,
                    }}
                  >
                    {displayName}
                  </div>
                  {emailLabel && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        fontWeight: 500,
                        color: isDark ? "#AEB8C8" : "#64748B",
                        lineHeight: 1.2,
                        wordBreak: "break-word",
                      }}
                    >
                      {emailLabel}
                    </div>
                  )}
                </DropdownMenuLabel>

                <DropdownMenuSeparator
                  style={{
                    margin: "2px 0 6px",
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                  }}
                />

                {settingItems.map((item) => (
                  <AccountMenuItem key={item.title} {...item} />
                ))}

                <DropdownMenuSeparator
                  style={{
                    margin: "6px 0 6px",
                    background: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
                  }}
                />

                <DropdownMenuItem
                  onClick={handleLogout}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "11px 12px",
                    borderRadius: 12,
                    cursor: "pointer",
                    margin: "2px 0",
                  }}
                >
                  <LogOut
                    style={{
                      width: 15,
                      height: 15,
                      flexShrink: 0,
                      color: palette.icon,
                    }}
                  />
                  <span
                    style={{
                      fontFamily: "'DM Sans',sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      color: palette.mutedText,
                    }}
                  >
                    Log out
                  </span>
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
