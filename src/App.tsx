
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

// Pages
import Dashboard from "./pages/Dashboard";
import WAFRules from "./pages/WAFRules";
import ThreatLogs from "./pages/ThreatLogs";
import APIEndpoints from "./pages/APIEndpoints";
import Integrations from "./pages/Integrations";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Playground from "./pages/Playground";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
              <AppSidebar />
              <div className="flex-1">
                <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
                  <div className="flex items-center space-x-4">
                    <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                      API Shield
                    </h1>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                    className="h-9 w-9"
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </header>
                <main className="p-6">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/waf-rules" element={<WAFRules />} />
                    <Route path="/threat-logs" element={<ThreatLogs />} />
                    <Route path="/api-endpoints" element={<APIEndpoints />} />
                    <Route path="/integrations" element={<Integrations />} />
                    <Route path="/users" element={<Users />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/playground" element={<Playground />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </div>
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
