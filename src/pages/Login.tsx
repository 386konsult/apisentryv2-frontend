import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, Settings2, Sun, Moon } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { API_BASE_URL } from '@/services/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false;

    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }

    return document.documentElement.classList.contains('dark');
  });

  const themeMenuRef = useRef<HTMLDivElement | null>(null);

  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const { toast } = useToast();

  const returnUrl = searchParams.get('returnUrl');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    localStorage.setItem('app-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || data?.detail || 'Login failed');
      }

      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

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
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-[#081224] dark:via-[#0B1B34] dark:to-[#102848]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-blue-500/20" />
          <div className="absolute -bottom-24 -right-16 h-[24rem] w-[24rem] rounded-full bg-blue-300/30 blur-3xl dark:bg-sky-500/15" />
          <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
        </div>

        <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6" ref={themeMenuRef}>
          <button
            type="button"
            onClick={() => setShowThemeMenu((prev) => !prev)}
            aria-label="Theme settings"
            aria-expanded={showThemeMenu}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200/50 bg-white/70 text-slate-700 shadow-lg backdrop-blur-xl transition hover:border-blue-300 hover:text-blue-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:text-sky-300"
          >
            <Settings2 className="h-5 w-5" />
          </button>

          {showThemeMenu && (
            <div className="absolute right-0 mt-3 w-64 rounded-2xl border border-blue-200/40 bg-white/80 p-4 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85">
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">Display settings</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Toggle dark mode for the app
                </p>
              </div>

              <div className="flex items-center justify-between gap-3 rounded-xl border border-blue-100/70 bg-white/50 px-3 py-3 dark:border-white/10 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  {isDarkMode ? (
                    <Moon className="h-4 w-4 text-sky-500 dark:text-sky-300" />
                  ) : (
                    <Sun className="h-4 w-4 text-blue-600 dark:text-sky-300" />
                  )}

                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Dark mode</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {isDarkMode ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDarkMode((prev) => !prev)}
                  aria-label="Toggle dark mode"
                  className={`relative h-6 w-11 rounded-full transition ${
                    isDarkMode ? 'bg-blue-600' : 'bg-slate-300 dark:bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                      isDarkMode ? 'left-[22px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
          <div className="w-full max-w-[440px]">
            <div className="mb-7 flex items-center justify-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 shadow-lg shadow-blue-500/30">
                <Shield className="h-5 w-5 text-white" />
              </div>

              <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Heimdall <span className="text-slate-900 dark:text-white">by </span>
                <a
                  href="https://www.Smartcomplyapp.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-blue-600 no-underline transition-colors hover:text-sky-500 dark:text-sky-400 dark:hover:text-cyan-300"
                >
                  Smartcomply
                </a>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[28px] border border-blue-200/40 bg-white/65 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
              <CardHeader className="space-y-2 px-8 pt-8">
                <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                  Sign in to your security dashboard to monitor and protect your APIs
                </CardDescription>
              </CardHeader>

              <CardContent className="px-8 pb-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                    >
                      Email address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                      className="h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                    >
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
                        className="h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                        onClick={() => setShowPassword((prev) => !prev)}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      Remember me
                    </label>

                    <Link
                      to="/forgot-password"
                      className="font-medium text-blue-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-cyan-300"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-sky-400"
                  >
                    {isLoading ? 'Signing in...' : 'Sign in to dashboard'}
                  </Button>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-blue-100 dark:bg-white/10" />
                    <span className="text-xs uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                      or
                    </span>
                    <div className="h-px flex-1 bg-blue-100 dark:bg-white/10" />
                  </div>

                  <Button
                    asChild
                    type="button"
                    variant="outline"
                    className="h-12 w-full rounded-xl border border-blue-200/60 bg-white/50 !text-slate-900 text-sm font-medium backdrop-blur-sm transition hover:bg-white/80 hover:!text-slate-900 dark:border-white/10 dark:bg-white/5 dark:!text-slate-200 dark:hover:bg-white/10 dark:hover:!text-slate-200"
                  >
                    <Link to="/register">Sign up</Link>
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
