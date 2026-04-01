import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
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
    phoneNumber: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const returnUrl = searchParams.get('returnUrl');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.phoneNumber && !/^[\d\s\-\+\(\)]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
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
      const username = formData.email;

      const userData = {
        email: formData.email,
        password: formData.password,
        password_confirm: formData.confirmPassword,
        first_name: formData.firstName,
        last_name: formData.lastName,
        username,
        phone_number: formData.phoneNumber || undefined,
        company_name: formData.companyName || undefined,
      };

      const response = await apiService.register(userData);

      toast({
        title: 'Registration successful',
        description: response.message || 'Your account has been created successfully',
      });

      setTimeout(() => {
        const loginUrl = returnUrl
          ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
          : '/login';
        navigate(loginUrl, { replace: true });
      }, 1500);
    } catch (error: any) {
      console.error('Registration error:', error);

      toast({
        title: 'Registration failed',
        description: error?.body?.message || error?.message || 'Registration failed. Please try again.',
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
    strengthCount === 3 ? 'good' :
    strengthCount === 4 ? 'strong' : '';

  const loginUrl = returnUrl
    ? `/login?returnUrl=${encodeURIComponent(returnUrl)}`
    : '/login';

  const stepButtonClass = (step: RegisterStep) =>
    activeStep === step
      ? 'text-blue-600 dark:text-sky-400'
      : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300';

  const stepCircleClass = (step: RegisterStep) =>
    activeStep === step
      ? 'bg-gradient-to-br from-blue-600 to-sky-500 text-white border-transparent'
      : 'border border-blue-100 bg-white/70 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500';

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-[#081224] dark:via-[#0B1B34] dark:to-[#102848]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute -bottom-24 -right-16 h-[24rem] w-[24rem] rounded-full bg-blue-300/30 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[480px]">
          <div className="mb-4 flex items-center justify-center gap-3">
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

          <div className="mb-6 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
              AI threat detection ready
            </div>
          </div>

          <Card className="overflow-hidden rounded-[28px] border border-blue-200/40 bg-white/65 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
            <CardContent className="px-8 pb-8 pt-8">
              <div className="mb-6 flex items-center">
                <div className="flex w-full items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveStep('account')}
                    className={`flex items-center gap-2 transition ${stepButtonClass('account')}`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${stepCircleClass('account')}`}>
                      01
                    </div>
                    <span className="text-[11px] font-medium">Account</span>
                  </button>

                  <div className="h-px flex-1 bg-blue-100 dark:bg-white/10" />

                  <button
                    type="button"
                    onClick={() => setActiveStep('security')}
                    className={`flex items-center gap-2 transition ${stepButtonClass('security')}`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${stepCircleClass('security')}`}>
                      02
                    </div>
                    <span className="text-[11px] font-medium">Security</span>
                  </button>
                </div>
              </div>

              {activeStep === 'account' && (
                <>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Create account</h1>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Create your account and continue to security settings to complete setup.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          First name
                        </Label>
                        <Input
                          id="firstName"
                          type="text"
                          placeholder="John"
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          className={`h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
                            errors.firstName ? 'border-red-400 focus-visible:ring-red-500/20' : ''
                          }`}
                          required
                        />
                        {errors.firstName && (
                          <p className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="h-3 w-3" />
                            {errors.firstName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                          Last name
                        </Label>
                        <Input
                          id="lastName"
                          type="text"
                          placeholder="Doe"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          className={`h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
                            errors.lastName ? 'border-red-400 focus-visible:ring-red-500/20' : ''
                          }`}
                          required
                        />
                        {errors.lastName && (
                          <p className="flex items-center gap-1 text-xs text-red-500">
                            <XCircle className="h-3 w-3" />
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Work email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@company.com"
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        autoComplete="email"
                        className={`h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
                          errors.email ? 'border-red-400 focus-visible:ring-red-500/20' : ''
                        }`}
                        required
                      />
                      {errors.email && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" />
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Company
                      </Label>
                      <Input
                        id="companyName"
                        type="text"
                        placeholder="Company name (optional)"
                        value={formData.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                        className="h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => setActiveStep('security')}
                      className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-sky-400"
                    >
                      Continue →
                    </Button>
                  </form>
                </>
              )}



              {activeStep === 'security' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                      Security setup
                    </h1>
                    <p className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                      Create a strong password to secure your Heimdall account before finishing setup.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phoneNumber" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                        Phone number
                      </Label>
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={formData.phoneNumber}
                        onChange={(e) => handleChange('phoneNumber', e.target.value)}
                        className={`h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
                          errors.phoneNumber ? 'border-red-400 focus-visible:ring-red-500/20' : ''
                        }`}
                      />
                      {errors.phoneNumber && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" />
                          {errors.phoneNumber}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
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
                          className={`h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
                            errors.password ? 'border-red-400 focus-visible:ring-red-500/20' : ''
                          }`}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      {formData.password && (
                        <div className="space-y-2 pt-1">
                          <div className="flex gap-1">
                            {[0, 1, 2, 3].map((index) => (
                              <div
                                key={index}
                                className={`h-1 flex-1 rounded-full ${
                                  index < strengthCount
                                    ? 'bg-cyan-500'
                                    : 'bg-blue-100 dark:bg-white/10'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                            strength: {strengthLabel || 'too short'}
                          </p>

                          <div className="space-y-1">
                            <p className={`flex items-center gap-1 text-xs ${formData.password.length >= 8 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {formData.password.length >= 8 ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              At least 8 characters
                            </p>
                            <p className={`flex items-center gap-1 text-xs ${/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password) ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              Uppercase and lowercase letters
                            </p>
                            <p className={`flex items-center gap-1 text-xs ${/\d/.test(formData.password) ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                              {/\d/.test(formData.password) ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                              At least one number
                            </p>
                          </div>
                        </div>
                      )}

                      {errors.password && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" />
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
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
                          className={`h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 pr-12 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500 ${
                            errors.confirmPassword ? 'border-red-400 focus-visible:ring-red-500/20' : ''
                          } ${
                            formData.confirmPassword && formData.password === formData.confirmPassword
                              ? 'border-emerald-400'
                              : ''
                          }`}
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>

                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <p className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                          <CheckCircle className="h-3 w-3" />
                          Passwords match
                        </p>
                      )}

                      {errors.confirmPassword && (
                        <p className="flex items-center gap-1 text-xs text-red-500">
                          <XCircle className="h-3 w-3" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setActiveStep('account')}
                        className="h-12 flex-1 rounded-xl border-blue-200/60 bg-white/50 text-slate-700 hover:bg-white/80 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
                      >
                        Back
                      </Button>

                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="h-12 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-sky-400"
                      >
                        {isLoading ? 'Creating account...' : 'Continue →'}
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{' '}
                <Link
                  to={loginUrl}
                  className="font-semibold text-blue-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-cyan-300"
                >
                  Sign in
                </Link>
              </p>

              <p className="mt-3 text-center text-xs leading-6 text-slate-500 dark:text-slate-400">
                By creating an account, you agree to our{' '}
                <Link
                  to="/terms"
                  className="font-medium text-blue-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-cyan-300"
                >
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link
                  to="/privacy"
                  className="font-medium text-blue-600 hover:text-sky-500 dark:text-sky-400 dark:hover:text-cyan-300"
                >
                  Privacy Policy
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Register;
