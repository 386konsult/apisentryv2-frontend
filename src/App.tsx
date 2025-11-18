import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import ProtectedPlatformRoute from "./components/ProtectedPlatformRoute";
import PlatformIndicator from "./components/PlatformIndicator";
import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlatformProvider } from "@/contexts/PlatformContext";

// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
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
import SecurityDashboard from "./pages/CodeReviewRepoDetails2";
import CodeReviewScanReports from "./pages/CodeReviewScanReports";
import CodeReviewReport from "./pages/CodeReviewReport";
import Platforms from "./pages/Platforms";
import PlatformDetails from "./pages/PlatformDetails";
import CreateAlert from "./pages/CreateAlert";
import SecurityAlerts from "./pages/SecurityAlerts";
import GitHubCallback from "./pages/GitHubCallback";
import ForcePasswordReset from "./pages/ForcePasswordReset";
import IPBlacklist from "./pages/IPBlacklist";
import SecurityHub from "./pages/SecurityHub";
import Incidents from "./pages/Incidents";
import AuditLogs from "./pages/AuditLogs";

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
        <Route path="/register" element={<Register />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth/github/callback" element={<GitHubCallback />} />
        <Route path="/force-password-reset" element={<ForcePasswordReset />} />
        {/* Main App Routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <SidebarProvider>
              <div className="min-h-screen flex w-full overflow-hidden bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <AppSidebar />
                <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                  <header className="h-16 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 flex-shrink-0">
                    <div className="flex items-center space-x-4 min-w-0">
                      <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                        {/* APISentry */}
                      </h1>
                    </div>
                    <div className="flex items-center space-x-4 flex-shrink-0">
                      <PlatformIndicator />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDarkMode}
                        className="h-9 w-9"
                      >
                        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                      </Button>
                    </div>
                  </header>
                  <main className="p-6 overflow-x-hidden overflow-y-auto flex-1 min-w-0">
                    <Routes>
                      <Route path="/" element={<Platforms />} />
                      <Route path="/dashboard" element={
                        <ProtectedPlatformRoute>
                          <Dashboard />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/waf-rules" element={<WAFRules />} />
                      <Route path="/threat-logs" element={<ThreatLogs />} />
                      <Route path="/api-endpoints" element={<APIEndpoints />} />
                      <Route path="/integrations" element={<Integrations />} />
                      <Route path="/users" element={<Users />} />
                      <Route path="/settings" element={
                        <ProtectedPlatformRoute>
                          <Settings />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/playground" element={
                        <ProtectedPlatformRoute>
                          <Playground />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/vulnerability-dashboard" element={<VulnerabilityDashboard />} />
                      <Route path="/vulnerability-scan" element={<VulnerabilityScan />} />
                      <Route path="/vulnerability-reports" element={<VulnerabilityReports />} />
                      <Route path="/vulnerability-settings" element={<VulnerabilitySettings />} />
                      <Route path="/code-review-dashboard" element={
                        <ProtectedPlatformRoute>
                          <CodeReviewDashboard />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/code-review-connect" element={
                        <ProtectedPlatformRoute>
                          <CodeReviewConnect />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/code-review-repos" element={
                        <ProtectedPlatformRoute>
                          <CodeReviewRepos />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/code-review-team" element={
                        <ProtectedPlatformRoute>
                          <CodeReviewTeam />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/code-review-repos/:repoName" element={
                        <ProtectedPlatformRoute>
                          <SecurityDashboard />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/code-review-scan-reports" element={
                        <ProtectedPlatformRoute>
                          <CodeReviewScanReports />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/code-review-report/:reportId" element={
                        <ProtectedPlatformRoute>
                          <CodeReviewReport />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/platforms" element={<Platforms />} />
                      <Route path="/platforms/:id" element={<PlatformDetails />} />
                      <Route path="/create-alert" element={<CreateAlert />} />
                      <Route path="/security-alerts" element={<SecurityAlerts />} />
                      <Route path="/security-hub" element={
                        <ProtectedPlatformRoute>
                          <SecurityHub />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/ip-blacklist" element={<IPBlacklist />} />
                      <Route path="/incidents" element={
                        <ProtectedPlatformRoute>
                          <Incidents />
                        </ProtectedPlatformRoute>
                      } />
                      <Route path="/audit-logs" element={
                        <ProtectedPlatformRoute>
                          <AuditLogs />
                        </ProtectedPlatformRoute>
                      } />
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
          <PlatformProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </PlatformProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
