import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import HeimdallAILogo from '@/components/HeimdallAILogo';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

type RegisterStep = 'account' | 'security';

const Register = () => {
  const [activeStep, setActiveStep] = useState<RegisterStep>('account');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    companyName: '',
    subdomain: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const returnUrl = searchParams.get('returnUrl');

  const validateAccountStep = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    if (!formData.companyName.trim()) {
      newErrors.companyName = 'Company name is required';
    }
    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (!/^[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain must be lowercase letters, numbers, and hyphens only';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleAccountContinue = () => {
    if (validateAccountStep()) {
      setActiveStep('security');
    } else {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before continuing.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        company_name: formData.companyName,
        subdomain: formData.subdomain,
      };

      const response = await apiService.register(userData);

      toast({
        title: 'Registration successful',
        description: response.message || 'Your account has been created successfully. Please check your email to verify your account.',
      });

      setTimeout(() => {
        const loginUrl = returnUrl
          ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
          : '/login';
        navigate(loginUrl, { replace: true });
      }, 2000);
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Registration failed. Please try again.';
      if (error.body) {
        if (typeof error.body === 'object') {
          const firstField = Object.keys(error.body)[0];
          if (firstField && error.body[firstField][0]) {
            errorMessage = error.body[firstField][0];
          } else if (error.body.detail) {
            errorMessage = error.body.detail;
          } else if (error.body.message) {
            errorMessage = error.body.message;
          }
        } else if (typeof error.body === 'string') {
          errorMessage = error.body;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast({
        title: 'Registration failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordChecks = [
    formData.password.length >= 8,
    /(?=.*[a-z])(?=.*[A-Z])/.test(formData.password),
    /\d/.test(formData.password),
    /[^a-zA-Z\d]/.test(formData.password) || formData.password.length >= 12,
  ];

  const strengthCount = passwordChecks.filter(Boolean).length;
  const strengthLabel =
    strengthCount <= 1 ? 'weak' :
    strengthCount === 2 ? 'fair' :
    strengthCount === 3 ? 'good' : 'strong';

  const loginUrl = returnUrl
    ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/login';

  const inputClass = (field: string) =>
    `h-11 rounded-lg border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus-visible:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500/30 ${
      errors[field] ? 'border-red-400 focus-visible:ring-red-400/30' : ''
    }`;

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
        <Link to="/" className="absolute top-8 left-8 z-20 flex items-center gap-2.5 no-underline hover:opacity-80 transition-opacity cursor-pointer">
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
          <div className="flex lg:hidden items-center gap-2">
            <HeimdallAILogo size={26} />
            <span className="font-bold text-slate-900 dark:text-white text-sm">Heimdall</span>
          </div>
          {/* Step indicator */}
          <div className="hidden lg:flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setActiveStep('account')}
              className={`font-medium transition-colors ${
                activeStep === 'account'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              01 · Account
            </button>
            <span className="text-slate-200 dark:text-white/10">—</span>
            <button
              type="button"
              onClick={() => setActiveStep('security')}
              className={`font-medium transition-colors ${
                activeStep === 'security'
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600'
              }`}
            >
              02 · Security
            </button>
          </div>
          <div className="ml-auto lg:ml-0" />
        </div>

        {/* Form — vertically centered */}
        <div className="flex-1 flex items-center justify-center px-8 py-8">
          <div className="w-full max-w-[420px]">

            {/* Mobile step indicator */}
            <div className="flex lg:hidden items-center gap-2 text-sm mb-6">
              <button
                type="button"
                onClick={() => setActiveStep('account')}
                className={`font-medium ${activeStep === 'account' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
              >
                01 · Account
              </button>
              <span className="text-slate-200 dark:text-white/10">—</span>
              <button
                type="button"
                onClick={() => setActiveStep('security')}
                className={`font-medium ${activeStep === 'security' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`}
              >
                02 · Security
              </button>
            </div>

            {/* ── STEP 1: Account ── */}
            {activeStep === 'account' && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Create account</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">
                  Provide credentials to create your account
                </p>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="firstName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        First name
                      </Label>
                      <Input
                        id="firstName"
                        type="text"
                        placeholder="First name"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className={inputClass('firstName')}
                        required
                      />
                      {errors.firstName && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" />{errors.firstName}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="lastName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Last name
                      </Label>
                      <Input
                        id="lastName"
                        type="text"
                        placeholder="Last name"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className={inputClass('lastName')}
                        required
                      />
                      {errors.lastName && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" />{errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="companyName" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Company
                    </Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Company"
                      value={formData.companyName}
                      onChange={(e) => handleChange('companyName', e.target.value)}
                      className={inputClass('companyName')}
                      required
                    />
                    {errors.companyName && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <XCircle className="h-3 w-3" />{errors.companyName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Email Address"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      autoComplete="email"
                      className={inputClass('email')}
                      required
                    />
                    {errors.email && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <XCircle className="h-3 w-3" />{errors.email}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="subdomain" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Subdomain
                    </Label>
                    <Input
                      id="subdomain"
                      type="text"
                      placeholder="your-company"
                      value={formData.subdomain}
                      onChange={(e) => handleChange('subdomain', e.target.value.toLowerCase())}
                      className={inputClass('subdomain')}
                      required
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      your-company.heimdall.smartcomply.com
                    </p>
                    {errors.subdomain && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <XCircle className="h-3 w-3" />{errors.subdomain}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleAccountContinue}
                    className="w-full h-11 rounded-lg font-semibold text-sm text-white transition-colors mt-2" style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
                  >
                    Create account
                  </button>
                </div>
              </>
            )}

            {/* ── STEP 2: Security ── */}
            {activeStep === 'security' && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Security setup</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-7">
                  Create a strong password to secure your account
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Min. 8 characters"
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        autoComplete="new-password"
                        className={`${inputClass('password')} pr-10`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {formData.password && (
                      <div className="space-y-2 pt-1">
                        <div className="flex gap-1">
                          {[0, 1, 2, 3].map((index) => (
                            <div
                              key={index}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                index < strengthCount
                                  ? 'bg-blue-500'
                                  : 'bg-slate-100 dark:bg-white/10'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          strength: {strengthLabel}
                        </p>
                        <div className="space-y-1">
                          <p className={`flex items-center gap-1 text-xs ${formData.password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {formData.password.length >= 8 ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            At least 8 characters
                          </p>
                          <p className={`flex items-center gap-1 text-xs ${/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            Uppercase and lowercase letters
                          </p>
                          <p className={`flex items-center gap-1 text-xs ${/\d/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            {/\d/.test(formData.password) ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            At least one number
                          </p>
                        </div>
                      </div>
                    )}

                    {errors.password && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <XCircle className="h-3 w-3" />{errors.password}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Confirm password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        autoComplete="new-password"
                        className={`${inputClass('confirmPassword')} pr-10`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle className="h-3 w-3" />Passwords match
                      </p>
                    )}
                    {errors.confirmPassword && (
                      <p className="flex items-center gap-1 text-xs text-red-500">
                        <XCircle className="h-3 w-3" />{errors.confirmPassword}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveStep('account')}
                      className="flex-1 h-11 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/10 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="flex-1 h-11 rounded-lg font-semibold text-sm text-white transition-colors disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2563EB, #0EA5E9)', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' }}
                    >
                      {isLoading ? 'Creating account...' : 'Continue →'}
                    </button>
                  </div>
                </form>
              </>
            )}

            <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
              <Link to={loginUrl} className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-4 px-6 pb-6 text-xs text-slate-400 dark:text-slate-500">
          <Link to="/terms" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Terms of service
          </Link>
          <Link to="/privacy" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            Privacy notice
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
