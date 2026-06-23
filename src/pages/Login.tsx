import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import HeimdallAILogo from '@/components/HeimdallAILogo';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

const THEME_STORAGE_KEY = 'heimdall_theme';

const getStoredTheme = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(THEME_STORAGE_KEY) === 'dark';
};

const applyTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getStoredTheme);

  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    applyTheme(isDarkMode);
  }, [isDarkMode]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await apiService.login({ email, password });

      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      if (login) {
        await login(email, password);
      }

      toast({
        title: 'Login successful',
        description: 'Welcome to Heimdall by Smartcomply!',
      });

      if (returnUrl) {
        window.location.href = returnUrl;
      } else {
        window.location.href = '/platforms';
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = 'Invalid credentials';
      if (error.body) {
        if (typeof error.body === 'object') {
          if (error.body.error) {
            errorMessage = error.body.error;
          } else if (error.body.detail) {
            errorMessage = error.body.detail;
          } else if (error.body.message) {
            errorMessage = error.body.message;
          } else {
            const firstKey = Object.keys(error.body)[0];
            if (firstKey && error.body[firstKey] && error.body[firstKey][0]) {
              errorMessage = error.body[firstKey][0];
            }
          }
        } else if (typeof error.body === 'string') {
          errorMessage = error.body;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: 'Login failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">

      {/* ── LEFT BRANDING PANEL ── */}
      <div
        className="hidden lg:flex lg:w-[46%] relative flex-col overflow-hidden select-none"
        style={{
          background: 'linear-gradient(160deg, #2563EB 0%, #1d4ed8 40%, #0ea5e9 80%, #06b6d4 100%)',
        }}
      >
        {/* Decorative concentric rings */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[640, 510, 390, 275, 165].map((size, i) => (
            <div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: size,
                height: size,
                borderColor: `rgba(255,255,255,${0.04 + i * 0.012})`,
              }}
            />
          ))}
        </div>

        {/* Glow blobs */}
        <div className="absolute top-1/4 right-0 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 left-0 w-60 h-60 rounded-full bg-sky-400/8 blur-3xl pointer-events-none" />

        {/* Logo — top left — links back to landing page */}
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity">
          <HeimdallAILogo size={30} />
          <div className="leading-tight">
            <span className="text-white font-bold text-sm tracking-tight block">Heimdall</span>
            <span className="text-white/40 text-[10px] tracking-wide">by Smartcomply</span>
          </div>
        </Link>

        {/* Main headline */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-10">
          <h1 className="text-white text-[2.1rem] font-bold text-center leading-snug mb-8 max-w-[290px]">
            Smarter API Security for Modern Teams
          </h1>
          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            {[
              { label: 'AI-Powered', filled: false },
              { label: 'Real-Time', filled: true },
              { label: 'Zero-Trust', filled: true },
            ].map(({ label, filled }) => (
              <span
                key={label}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide border ${
                  filled
                    ? 'bg-blue-600/70 border-blue-500/40 text-white'
                    : 'bg-transparent border-white/25 text-white/75'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="absolute bottom-8 left-0 right-0 text-center text-white/25 text-xs tracking-wide">
          Trusted by engineering teams worldwide
        </p>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 pt-6">
          {/* Mobile-only logo */}
          <div className="flex lg:hidden items-center gap-2">
            <HeimdallAILogo size={26} />
            <span className="font-bold text-slate-900 dark:text-white text-sm">Heimdall</span>
          </div>
          <div className="lg:ml-auto ml-auto">
            <button
              type="button"
              onClick={() => setIsDarkMode((prev) => !prev)}
              aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
            >
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Form — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-8 py-10">
          <div className="w-full max-w-[380px]">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Sign in</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
              Enter your credentials to access your dashboard
            </p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="h-11 rounded-lg border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/30"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="h-11 rounded-lg border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/30 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 dark:border-white/20 accent-blue-600"
                  />
                  Remember me
                </label>
                <Link
                  to="/forgot-password"
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-colors disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 pb-6 text-xs text-slate-400 dark:text-slate-500">
          <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Privacy notice
          </Link>
          <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Cookie notice
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
