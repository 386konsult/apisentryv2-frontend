import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided. Please check the link.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/verify-email/?token=${token}`);
        const data = await response.json();
        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully! You can now log in.');
        } else {
          setStatus('error');
          setMessage(data.error || 'Verification failed. The link may be invalid or expired.');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    verify();
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="relative min-h-screen overflow-hidden bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-[#081224] dark:via-[#0B1B34] dark:to-[#102848]" />
        <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
          <Card className="w-full max-w-md overflow-hidden rounded-[28px] border border-blue-200/40 bg-white/65 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
            <CardContent className="pt-6 text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-slate-600 dark:text-slate-400">Verifying your email...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-blue-100 to-cyan-100 dark:from-[#081224] dark:via-[#0B1B34] dark:to-[#102848]" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md overflow-hidden rounded-[28px] border border-blue-200/40 bg-white/65 shadow-2xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/70">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold text-slate-900 dark:text-white">
              {status === 'success' ? 'Email Verified' : 'Verification Failed'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'success' ? (
              <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="mx-auto h-16 w-16 text-red-500" />
            )}
            <p className="mt-4 text-slate-700 dark:text-slate-300">{message}</p>
            <Button asChild className="mt-6">
              <Link to="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VerifyEmail;