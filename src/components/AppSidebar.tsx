
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
  SidebarTrigger,
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
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/", icon: BarChart3 },
  { title: "WAF Rules", url: "/waf-rules", icon: Shield },
  { title: "Threat Logs", url: "/threat-logs", icon: AlertTriangle },
  { title: "API Endpoints", url: "/api-endpoints", icon: Globe },
  { title: "Integrations", url: "/integrations", icon: Puzzle },
  { title: "Users & Teams", url: "/users", icon: Users },
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Playground", url: "/playground", icon: Code },
];

const AppSidebar = () => {
  const { collapsed } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const getNavCls = (path: string) =>
    isActive(path)
      ? "bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 dark:text-blue-400 border-r-2 border-blue-500"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      className={`${collapsed ? "w-14" : "w-64"} transition-all duration-300 border-r border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60`}
      collapsible
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
              {navigationItems.map((item) => (
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
      </SidebarContent>
    </Sidebar>
  );
};

export default AppSidebar;
