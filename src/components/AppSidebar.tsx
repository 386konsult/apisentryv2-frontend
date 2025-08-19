
import { NavLink, useLocation } from "react-router-dom";
import {
  Shield,
  BarChart3,
  AlertTriangle,
  Globe,
  Settings,
  Users,
  Puzzle,
  Code,
  PanelLeft,
  LogOut,
  Bug,
  Search,
  Clock,
  FileText,
  LayoutDashboard,
  Link2,
  BookOpen,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const securityPlatformItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "WAF Rules", url: "/waf-rules", icon: Shield },
  { title: "Threat Logs", url: "/threat-logs", icon: AlertTriangle },
  { title: "API Endpoints", url: "/api-endpoints", icon: Globe },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Users & Teams", url: "/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Playground", url: "/playground", icon: Code },
];

const vulnerabilityManagementItems = [
  { title: "Vulnerability Dashboard", url: "/vulnerability-dashboard", icon: Bug },
  { title: "Run Scan", url: "/vulnerability-scan", icon: Search },
  { title: "Reports", url: "/vulnerability-reports", icon: FileText },
  { title: "Scan Settings", url: "/vulnerability-settings", icon: Clock },
];

const sourceCodeReviewItems = [
  { title: "Dashboard", url: "/code-review-dashboard", icon: LayoutDashboard },
  { title: "Connect Repository", url: "/code-review-connect", icon: Link2 },
  { title: "Repositories", url: "/code-review-repos", icon: BookOpen },
  { title: "Scan Reports", url: "/code-review-scan-reports", icon: FileText },
  { title: "Team Security Habits", url: "/code-review-team", icon: Users },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const location = useLocation();
  const { logout, user } = useAuth();
  const collapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path)
      ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300 border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
      collapsible="icon"
    >
      <div className="p-4">
        <SidebarTrigger />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Security Platform
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {securityPlatformItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${getNavCls(item.url)}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Vulnerability Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {vulnerabilityManagementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${getNavCls(item.url)}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Source Code Review
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {sourceCodeReviewItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 transition-all ${getNavCls(item.url)}`}
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      {!collapsed && (
                        <span className="font-medium">{item.title}</span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Info and Logout */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {!collapsed && user && (
              <div className="px-3 py-2 mb-2">
                <div className="text-sm font-medium">{user.first_name} {user.last_name}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
            )}
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    {!collapsed && "Logout"}
                  </Button>
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
