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
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Auth Pages
import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import Onboarding from "./pages/Onboarding";

// Main Pages
import Dashboard from "./pages/Dashboard";
import WAFRules from "./pages/WAFRules";
import ThreatLogs from "./pages/ThreatLogs";
import APIEndpoints from "./pages/APIEndpoints";
import Integrations from "./pages/Integrations";
import Users from "./pages/Users";
import Settings from "./pages/Settings";
import Playground from "./pages/Playground";
import VulnerabilityDashboard from "./pages/VulnerabilityDashboard";
import VulnerabilityScan from "./pages/VulnerabilityScan";
import VulnerabilitySettings from "./pages/VulnerabilitySettings";
import VulnerabilityReports from "./pages/VulnerabilityReports";
import NotFound from "./pages/NotFound";
import CodeReviewDashboard from "./pages/CodeReviewDashboard";
import CodeReviewConnect from "./pages/CodeReviewConnect";
import CodeReviewRepos from "./pages/CodeReviewRepos";
import CodeReviewTeam from "./pages/CodeReviewTeam";
import CodeReviewRepoDetails from "./pages/CodeReviewRepoDetails";
import Platforms from "./pages/Platforms";
import PlatformDetails from "./pages/PlatformDetails";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <>{children}</>;
};

const AppContent = () => {
  const [isDark, setIsDark] = useState(false);

  const toggleDarkMode = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Main App Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <SidebarProvider>
              <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <AppSidebar />
                <div className="flex-1">
                  <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6">
                    <div className="flex items-center space-x-4">
                      <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                        {/* APISentry */}
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
                      <Route path="/" element={<Platforms />} />
                      <Route path="/waf-rules" element={<WAFRules />} />
                      <Route path="/threat-logs" element={<ThreatLogs />} />
                      <Route path="/api-endpoints" element={<APIEndpoints />} />
                      <Route path="/integrations" element={<Integrations />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/playground" element={<Playground />} />
                      <Route path="/vulnerability-dashboard" element={<VulnerabilityDashboard />} />
                      <Route path="/vulnerability-scan" element={<VulnerabilityScan />} />
                      <Route path="/vulnerability-reports" element={<VulnerabilityReports />} />
                      <Route path="/vulnerability-settings" element={<VulnerabilitySettings />} />
                      <Route path="/code-review-dashboard" element={<CodeReviewDashboard />} />
                      <Route path="/code-review-connect" element={<CodeReviewConnect />} />
                      <Route path="/code-review-repos" element={<CodeReviewRepos />} />
                      <Route path="/code-review-team" element={<CodeReviewTeam />} />
                      <Route path="/code-review-repos/:repoName" element={<CodeReviewRepoDetails />} />
                      <Route path="/platforms" element={<Platforms />} />
                      <Route path="/platforms/:id" element={<PlatformDetails />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
