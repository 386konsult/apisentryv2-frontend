import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import AppSidebar from "./components/AppSidebar";
import ProtectedPlatformRoute from "./components/ProtectedPlatformRoute";
import PlatformIndicator from "./components/PlatformIndicator";
import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlatformProvider } from "@/contexts/PlatformContext";



// Auth Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import OTPVerification from "./pages/OTPVerification";
import Onboarding from "./pages/Onboarding";
import ForgotPassword from "./pages/ForgotPassword";
import PasswordReset from "./pages/PasswordReset";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";

// Main Pages
import WAFRules from "./pages/WAFRules";
import ThreatLogs from "./pages/ThreatLogs";
import APIEndpoints from "./pages/APIEndpoints";
import EndpointAnalytics from "./pages/EndpointAnalytics";
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
import GitAutomatedScan from "./pages/GitAutomatedScan";
import AutomatedScanDetails from "./pages/AutomatedScanDetails";
import Platforms from "./pages/Platforms";
import PlatformDetails from "./pages/PlatformDetails";
import CreateAlert from "./pages/CreateAlert";
import SecurityAlerts from "./pages/SecurityAlerts";
import GitHubCallback from "./pages/GitHubCallback";
import BitbucketCallback from "./pages/BitbucketCallback";
import CISOReports from "./pages/CISOReports";
// import ForcePasswordReset from "./pages/ForcePasswordReset";
import IPBlacklist from "./pages/IPBlacklist";
import SecurityHub from "./pages/SecurityHub";
import Incidents from "./pages/Incidents";
import AuditLogs from "./pages/AuditLogs";
import AcceptInvitation from "./pages/AcceptInvitation";
import Invitations from "./components/Invitations"; // Import the Invitations component
import VerifyEmail from './pages/VerifyEmail';
import RateLimiting from "@/pages/RateLimiting";
const queryClient = new QueryClient();

const THEME_STORAGE_KEY = "app-theme";

const getStoredTheme = () => {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(THEME_STORAGE_KEY) === "dark";
};

const applyTheme = (isDark: boolean) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
};

if (typeof document !== "undefined") {
  applyTheme(getStoredTheme());
}

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
  const [isDark, setIsDark] = useState(getStoredTheme);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark((prev) => !prev);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Must be before protected routes */}
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/invitations/accept/:token" element={<AcceptInvitation />} />

        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/password-reset-confirm/:uid/:token" element={<PasswordReset />} />
        <Route path="/otp-verification" element={<OTPVerification />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/auth/github/callback" element={<GitHubCallback />} />
        <Route path="/auth/bitbucket/callback" element={<BitbucketCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />        {/* <Route path="/force-password-reset" element={<ForcePasswordReset />} /> */}

        {/* Main App Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <SidebarProvider>
                <div className="min-h-screen flex w-full overflow-hidden bg-[#f4f8ff] dark:bg-[#0f1724]">
                  <AppSidebar isDark={isDark} />

                  <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                    <header className="h-16 border-b border-slate-200/70 bg-[#f4f8ff] flex items-center px-6 flex-shrink-0 dark:border-slate-800/80 dark:bg-[#0f1724]">
  <div className="flex-1 min-w-0">
    <PlatformIndicator />
  </div>
</header>

                    <main className="p-6 overflow-x-hidden overflow-y-auto flex-1 min-w-0">
                      <Routes>
                        <Route path="/" element={<Platforms />} />

                        <Route
                          path="/waf-rules"
                          element={
                            <ProtectedPlatformRoute>
                              <WAFRules />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/threat-logs"
                          element={
                            <ProtectedPlatformRoute>
                              <ThreatLogs />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/api-endpoints"
                          element={
                            <ProtectedPlatformRoute>
                              <APIEndpoints />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/api-endpoints/:endpointId/analytics"
                          element={
                            <ProtectedPlatformRoute>
                              <EndpointAnalytics />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/integrations"
                          element={
                            <ProtectedPlatformRoute>
                              <Integrations />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route path="/users" element={<Users />} />

                        <Route path="/invitations" element={<Invitations />} />

                        <Route
                          path="/settings"
                          element={
                            <ProtectedPlatformRoute>
                              <Settings />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/playground"
                          element={
                            <ProtectedPlatformRoute>
                              <Playground />
                            </ProtectedPlatformRoute>
                          }
                        />
                        <Route path="/ciso-reports" element={
                            <ProtectedPlatformRoute>
                              <CISOReports />
                            </ProtectedPlatformRoute>
                          } />

                        <Route
                          path="/vulnerability-dashboard"
                          element={
                            <ProtectedPlatformRoute>
                              <VulnerabilityDashboard />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/vulnerability-scan"
                          element={
                            <ProtectedPlatformRoute>
                              <VulnerabilityScan />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/vulnerability-reports"
                          element={
                            <ProtectedPlatformRoute>
                              <VulnerabilityReports />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/vulnerability-settings"
                          element={
                            <ProtectedPlatformRoute>
                              <VulnerabilitySettings />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/code-review-dashboard"
                          element={
                            <ProtectedPlatformRoute>
                              <CodeReviewDashboard />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/code-review-connect"
                          element={
                            <ProtectedPlatformRoute>
                              <CodeReviewConnect />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/code-review-repos"
                          element={
                            <ProtectedPlatformRoute>
                              <CodeReviewRepos />
                            </ProtectedPlatformRoute>
                          }
                        />
                        <Route path="/endpoint-analytics/:endpointId" element={<EndpointAnalytics />} />

                        <Route
                          path="/code-review-team"
                          element={
                            <ProtectedPlatformRoute>
                              <CodeReviewTeam />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/code-review-repos/:repoName"
                          element={
                            <ProtectedPlatformRoute>
                              <SecurityDashboard />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/code-review-scan-reports"
                          element={
                            <ProtectedPlatformRoute>
                              <CodeReviewScanReports />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/code-review-report/:reportId"
                          element={
                            <ProtectedPlatformRoute>
                              <CodeReviewReport />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/git-automated-scan"
                          element={
                            <ProtectedPlatformRoute>
                              <GitAutomatedScan />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/automated-scan-details/:id"
                          element={
                            <ProtectedPlatformRoute>
                              <AutomatedScanDetails />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route path="/platforms" element={<Platforms />} />
                        <Route path="/platforms/:id" element={<PlatformDetails />} />

                        <Route
                          path="/create-alert"
                          element={
                            <ProtectedPlatformRoute>
                              <CreateAlert />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/security-alerts"
                          element={
                            <ProtectedPlatformRoute>
                              <SecurityAlerts />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/security-hub"
                          element={
                            <ProtectedPlatformRoute>
                              <SecurityHub />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/ip-blacklist"
                          element={
                            <ProtectedPlatformRoute>
                              <IPBlacklist />
                            </ProtectedPlatformRoute>
                          }
                        />

                        <Route
                          path="/incidents"
                          element={
                            <ProtectedPlatformRoute>
                              <Incidents />
                            </ProtectedPlatformRoute>
                          }
                        />
                        <Route path="/workspace/:id/rate-limiting" element={<RateLimiting />} />

                        <Route path="/audit-logs" element={<AuditLogs />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </ProtectedRoute>
          }
        />
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