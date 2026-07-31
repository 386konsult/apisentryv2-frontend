import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/services/api";
import { Shield, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMsg = "Failed to send password reset email.";
        if (data) errorMsg = data.error || data.detail || data.message || errorMsg;
        throw new Error(errorMsg);
      }

      setSent(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-[#081224] dark:via-[#0B1B34] dark:to-[#102848]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute -bottom-24 -right-16 h-[24rem] w-[24rem] rounded-full bg-blue-300/30 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">

          {/* Logo */}
          <div className="mb-6 flex items-center justify-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-sky-400 shadow-lg shadow-blue-500/30">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Heimdall</span>
          </div>

          <Card className="overflow-hidden rounded-[28px] border border-blue-200/40 bg-white/65 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
            <CardHeader className="space-y-2 px-8 pt-8 pb-4">
              <CardTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {sent ? "Check your inbox" : "Forgot password?"}
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                {sent
                  ? `We sent a reset link to ${email}`
                  : "Enter your email and we'll send you a reset link."}
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              {sent ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
                    <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                    Didn't get it? Check your spam folder or{" "}
                    <button
                      onClick={() => setSent(false)}
                      className="font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      try again
                    </button>
                    .
                  </p>
                  <Link
                    to="/login"
                    className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label
                      htmlFor="email"
                      className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                    >
                      Email
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="h-12 rounded-xl border-blue-200/60 bg-white/70 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-sky-400"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </Button>

                  {/* Divider */}
                  <div className="relative flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/10" />
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">or</span>
                    <div className="h-px flex-1 bg-slate-200/70 dark:bg-white/10" />
                  </div>

                  {/* Sign In / Sign Up */}
                  <div className="grid grid-cols-2 gap-3">
                    <Link to="/login">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full rounded-xl border-blue-200/60 bg-white/50 text-sm font-semibold text-slate-700 hover:bg-white/80 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 transition-all"
                      >
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full rounded-xl border-blue-200/60 bg-white/50 text-sm font-semibold text-slate-700 hover:bg-white/80 hover:border-blue-300 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10 transition-all"
                      >
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-500 dark:text-slate-500">
            Protected by Heimdall WAF &bull; Smartcomply &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
