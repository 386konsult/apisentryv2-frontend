import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { lazy, Suspense, useEffect, useState, useRef, useCallback } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { PlatformProvider } from "@/contexts/PlatformContext";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

// Eagerly loaded — always needed immediately
import AppSidebar from "./components/AppSidebar";
import ProtectedPlatformRoute from "./components/ProtectedPlatformRoute";
import PlatformIndicator from "./components/PlatformIndicator";
import Login from "./pages/Login";

// Lazy-loaded — only downloaded when the user navigates to that route
const Register            = lazy(() => import("./pages/Register"));
const OTPVerification     = lazy(() => import("./pages/OTPVerification"));
const Onboarding          = lazy(() => import("./pages/Onboarding"));
const ForgotPassword      = lazy(() => import("./pages/ForgotPassword"));
const PasswordReset       = lazy(() => import("./pages/PasswordReset"));
const TermsAndConditions  = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy       = lazy(() => import("./pages/PrivacyPolicy"));
const AcceptInvitation    = lazy(() => import("./pages/AcceptInvitation"));
const VerifyEmail         = lazy(() => import("./pages/VerifyEmail"));
const GitHubCallback      = lazy(() => import("./pages/GitHubCallback"));
const BitbucketCallback   = lazy(() => import("./pages/BitbucketCallback"));

const Platforms           = lazy(() => import("./pages/Platforms"));
const PlatformDetails     = lazy(() => import("./pages/PlatformDetails"));
const WAFRules            = lazy(() => import("./pages/WAFRules"));
const ThreatLogs          = lazy(() => import("./pages/ThreatLogs"));
const APIEndpoints        = lazy(() => import("./pages/APIEndpoints"));
const EndpointAnalytics   = lazy(() => import("./pages/EndpointAnalytics"));
const Integrations        = lazy(() => import("./pages/Integrations"));
const Users               = lazy(() => import("./pages/Users"));
const Settings            = lazy(() => import("./pages/Settings"));
const Playground          = lazy(() => import("./pages/Playground"));
const CISOReports         = lazy(() => import("./pages/CISOReports"));
const SecurityHub         = lazy(() => import("./pages/SecurityHub"));
const SecurityAlerts      = lazy(() => import("./pages/SecurityAlerts"));
const CreateAlert         = lazy(() => import("./pages/CreateAlert"));
const Incidents           = lazy(() => import("./pages/Incidents"));
const IPBlacklist         = lazy(() => import("./pages/IPBlacklist"));
const AuditLogs           = lazy(() => import("./pages/AuditLogs"));
const RateLimiting        = lazy(() => import("./pages/RateLimiting"));
const HeimdallAI          = lazy(() => import("./pages/HeimdallAI"));

const VulnerabilityDashboard  = lazy(() => import("./pages/VulnerabilityDashboard"));
const VulnerabilityScan       = lazy(() => import("./pages/VulnerabilityScan"));
const VulnerabilitySettings   = lazy(() => import("./pages/VulnerabilitySettings"));
const VulnerabilityReports    = lazy(() => import("./pages/VulnerabilityReports"));

const CodeReviewDashboard     = lazy(() => import("./pages/CodeReviewDashboard"));
const CodeReviewConnect       = lazy(() => import("./pages/CodeReviewConnect"));
const CodeReviewRepos         = lazy(() => import("./pages/CodeReviewRepos"));
const CodeReviewTeam          = lazy(() => import("./pages/CodeReviewTeam"));
const SecurityDashboard       = lazy(() => import("./pages/CodeReviewRepoDetails2"));
const CodeReviewScanReports   = lazy(() => import("./pages/CodeReviewScanReports"));
const CodeReviewReport        = lazy(() => import("./pages/CodeReviewReport"));
const GitAutomatedScan        = lazy(() => import("./pages/GitAutomatedScan"));
const AutomatedScanDetails    = lazy(() => import("./pages/AutomatedScanDetails"));

const Invitations             = lazy(() => import("./components/Invitations"));
const NotFound                = lazy(() => import("./pages/NotFound"));

// ── QueryClient — aggressive caching so navigating back never re-fetches ──────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,          // data stays fresh for 30s
      gcTime:    5 * 60_000,      // unused cache lives for 5 min
      retry: 1,
      refetchOnWindowFocus: false, // don't slam the API when the user alt-tabs back
    },
  },
});

const THEME_STORAGE_KEY = "heimdall_theme";
const getStoredTheme = () => typeof window !== "undefined" && localStorage.getItem(THEME_STORAGE_KEY) === "dark";
const applyTheme = (isDark: boolean) => {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
};

if (typeof document !== "undefined") applyTheme(getStoredTheme());

// Scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior }); }, [pathname]);
  return null;
};

// Minimal spinner shown during lazy-load transitions
const PageLoader = () => (
  <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
    <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
  </div>
);

// Protected route — redirects to login if not authenticated
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f8ff]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
      </div>
    );
  }
  if (!isAuthenticated) return <Login />;
  return <>{children}</>;
};

// Heimdall AI floating action button
const HeimdallFAB: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(true);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    setExpanded(true);
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    collapseTimer.current = setTimeout(() => setExpanded(false), 3000);
  }, []);

  useEffect(() => {
    // Start collapsed after 3s on mount
    collapseTimer.current = setTimeout(() => setExpanded(false), 3000);

    const main = document.querySelector("main");
    const onActivity = () => resetTimer();

    main?.addEventListener("scroll", onActivity, { passive: true });
    window.addEventListener("mousemove", onActivity, { passive: true });

    return () => {
      if (collapseTimer.current) clearTimeout(collapseTimer.current);
      main?.removeEventListener("scroll", onActivity);
      window.removeEventListener("mousemove", onActivity);
    };
  }, [resetTimer]);

  if (location.pathname === "/heimdall-ai") return null;

  return (
    <motion.button
      onClick={() => navigate("/heimdall-ai")}
      onMouseEnter={() => { if (collapseTimer.current) clearTimeout(collapseTimer.current); setExpanded(true); }}
      onMouseLeave={() => resetTimer()}
      whileTap={{ scale: 0.96 }}
      animate={{ width: expanded ? 136 : 44 }}
      transition={{ type: "spring", stiffness: 400, damping: 28, mass: 0.6 }}
      aria-label="Heimdall AI"
      className="fixed bottom-6 right-6 z-50 flex h-11 items-center overflow-hidden rounded-full
        bg-gradient-to-r from-blue-600 to-cyan-500
        shadow-[0_4px_24px_rgba(37,99,235,0.45)]
        hover:shadow-[0_6px_28px_rgba(37,99,235,0.6)]
        hover:brightness-110
        transition-shadow transition-filter duration-200"
    >
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center">
        <Sparkles className="h-[18px] w-[18px] text-white" strokeWidth={2.2} />
      </span>
      <motion.span
        animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -6 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="pr-4 whitespace-nowrap text-[13px] font-semibold leading-none tracking-tight text-white pointer-events-none"
      >
        Heimdall AI
      </motion.span>
    </motion.button>
  );
};

const AppContent = () => {
  const [isDark, setIsDark] = useState(getStoredTheme);
  useEffect(() => { applyTheme(isDark); }, [isDark]);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          {/* Public */}
          <Route path="/terms"                              element={<TermsAndConditions />} />
          <Route path="/privacy"                            element={<PrivacyPolicy />} />
          <Route path="/invitations/accept/:token"          element={<AcceptInvitation />} />
          <Route path="/login"                              element={<Login />} />
          <Route path="/register"                           element={<Register />} />
          <Route path="/forgot-password"                    element={<ForgotPassword />} />
          <Route path="/password-reset-confirm/:uid/:token" element={<PasswordReset />} />
          <Route path="/otp-verification"                   element={<OTPVerification />} />
          <Route path="/onboarding"                         element={<Onboarding />} />
          <Route path="/auth/github/callback"               element={<GitHubCallback />} />
          <Route path="/auth/bitbucket/callback"            element={<BitbucketCallback />} />
          <Route path="/verify-email"                       element={<VerifyEmail />} />

          {/* Protected app shell */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <SidebarProvider defaultOpen={localStorage.getItem("heimdall_sidebar_open") !== "false"}>
                  <div className="min-h-screen flex w-full overflow-hidden bg-[#f4f8ff] dark:bg-[#0f1724]">
                    <AppSidebar isDark={isDark} />
                    <div className="flex-1 min-w-0 overflow-hidden flex flex-col">
                      <header className="h-16 border-b border-slate-200/70 bg-[#f4f8ff] flex items-center px-6 flex-shrink-0 dark:border-slate-800/80 dark:bg-[#0f1724]">
                        <div className="flex-1 min-w-0">
                          <PlatformIndicator />
                        </div>
                      </header>
                      <main className="p-6 overflow-x-hidden overflow-y-auto flex-1 min-w-0 relative">
                        <HeimdallFAB />
                        <Suspense fallback={<PageLoader />}>
                          <Routes>
                            <Route path="/"                    element={<Platforms />} />
                            <Route path="/platforms"           element={<Platforms />} />
                            <Route path="/platforms/:id"       element={<ProtectedPlatformRoute><PlatformDetails /></ProtectedPlatformRoute>} />

                            <Route path="/waf-rules"           element={<ProtectedPlatformRoute><WAFRules /></ProtectedPlatformRoute>} />
                            <Route path="/threat-logs"         element={<ProtectedPlatformRoute><ThreatLogs /></ProtectedPlatformRoute>} />
                            <Route path="/api-endpoints"       element={<ProtectedPlatformRoute><APIEndpoints /></ProtectedPlatformRoute>} />
                            <Route path="/api-endpoints/:endpointId/analytics" element={<ProtectedPlatformRoute><EndpointAnalytics /></ProtectedPlatformRoute>} />
                            <Route path="/endpoint-analytics/:endpointId"      element={<EndpointAnalytics />} />
                            <Route path="/integrations"        element={<ProtectedPlatformRoute><Integrations /></ProtectedPlatformRoute>} />
                            <Route path="/settings"            element={<ProtectedPlatformRoute><Settings /></ProtectedPlatformRoute>} />
                            <Route path="/playground"          element={<ProtectedPlatformRoute><Playground /></ProtectedPlatformRoute>} />
                            <Route path="/ciso-reports"        element={<ProtectedPlatformRoute><CISOReports /></ProtectedPlatformRoute>} />
                            <Route path="/security-hub"        element={<ProtectedPlatformRoute><SecurityHub /></ProtectedPlatformRoute>} />
                            <Route path="/security-alerts"     element={<ProtectedPlatformRoute><SecurityAlerts /></ProtectedPlatformRoute>} />
                            <Route path="/create-alert"        element={<ProtectedPlatformRoute><CreateAlert /></ProtectedPlatformRoute>} />
                            <Route path="/incidents"           element={<ProtectedPlatformRoute><Incidents /></ProtectedPlatformRoute>} />
                            <Route path="/ip-blacklist"        element={<ProtectedPlatformRoute><IPBlacklist /></ProtectedPlatformRoute>} />
                            <Route path="/workspace/:id/rate-limiting" element={<RateLimiting />} />

                            <Route path="/vulnerability-dashboard" element={<ProtectedPlatformRoute><VulnerabilityDashboard /></ProtectedPlatformRoute>} />
                            <Route path="/vulnerability-scan"      element={<ProtectedPlatformRoute><VulnerabilityScan /></ProtectedPlatformRoute>} />
                            <Route path="/vulnerability-reports"   element={<ProtectedPlatformRoute><VulnerabilityReports /></ProtectedPlatformRoute>} />
                            <Route path="/vulnerability-settings"  element={<ProtectedPlatformRoute><VulnerabilitySettings /></ProtectedPlatformRoute>} />

                            <Route path="/code-review-dashboard"   element={<ProtectedPlatformRoute><CodeReviewDashboard /></ProtectedPlatformRoute>} />
                            <Route path="/code-review-connect"     element={<ProtectedPlatformRoute><CodeReviewConnect /></ProtectedPlatformRoute>} />
                            <Route path="/code-review-repos"       element={<ProtectedPlatformRoute><CodeReviewRepos /></ProtectedPlatformRoute>} />
                            <Route path="/code-review-team"        element={<ProtectedPlatformRoute><CodeReviewTeam /></ProtectedPlatformRoute>} />
                            <Route path="/code-review-repos/:repoName" element={<ProtectedPlatformRoute><SecurityDashboard /></ProtectedPlatformRoute>} />
                            <Route path="/code-review-scan-reports"    element={<ProtectedPlatformRoute><CodeReviewScanReports /></ProtectedPlatformRoute>} />
                            <Route path="/code-review-report/:reportId" element={<ProtectedPlatformRoute><CodeReviewReport /></ProtectedPlatformRoute>} />
                            <Route path="/git-automated-scan"      element={<ProtectedPlatformRoute><GitAutomatedScan /></ProtectedPlatformRoute>} />
                            <Route path="/automated-scan-details/:id" element={<ProtectedPlatformRoute><AutomatedScanDetails /></ProtectedPlatformRoute>} />

                            <Route path="/users"       element={<Users />} />
                            <Route path="/invitations" element={<Invitations />} />
                            <Route path="/audit-logs"  element={<AuditLogs />} />
                            <Route path="/heimdall-ai" element={<HeimdallAI />} />
                            <Route path="*"            element={<NotFound />} />
                          </Routes>
                        </Suspense>
                      </main>
                    </div>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
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

export default App;
