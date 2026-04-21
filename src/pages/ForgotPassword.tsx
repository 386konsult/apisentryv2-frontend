import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/password-reset/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        // Extract specific error message from backend
        let errorMsg = "Failed to send password reset email.";
        if (data) {
          errorMsg = data.error || data.detail || data.message || errorMsg;
        }
        throw new Error(errorMsg);
      }

      toast({
        title: "Email Sent",
        description: "A password reset link has been sent to your email.",
        variant: "default",
      });
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-[#081224] dark:via-[#0B1B34] dark:to-[#102848]" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-[26rem] w-[26rem] rounded-full bg-sky-300/40 blur-3xl dark:bg-blue-500/20" />
        <div className="absolute -bottom-24 -right-16 h-[24rem] w-[24rem] rounded-full bg-blue-300/30 blur-3xl dark:bg-sky-500/15" />
        <div className="absolute left-1/2 top-1/2 h-[20rem] w-[20rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-3xl dark:bg-cyan-400/10" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[440px]">
          <Card className="overflow-hidden rounded-[28px] border border-blue-200/40 bg-white/65 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
            <CardHeader className="space-y-2 px-8 pt-8">
              <CardTitle className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-600 dark:text-slate-400">
                Enter your email to receive a password reset link.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 rounded-xl border-blue-200/60 bg-white/70 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                  />
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-500 hover:to-sky-400"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;