import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const GitHubCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing GitHub OAuth callback...');

  useEffect(() => {
    const safeParseJson = async (res: Response) => {
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) return null;
      try {
        return await res.json();
      } catch (e) {
        return null;
      }
    };

    // validate/sanitize platform id (accept only UUIDs)
    const sanitizePlatformId = (raw: string | null) => {
      if (!raw) return null;
      const trimmed = raw.trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
      // UUID v1-5 pattern (case-insensitive)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(trimmed) ? trimmed : null;
    };

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');

      // Try read platform id but allow null if none; sanitize it
      const urlPlatformId = searchParams.get('platform_id');
      const storagePlatformId = localStorage.getItem('selected_platform_id');
      const rawPlatformId = urlPlatformId || storagePlatformId || null;
      const platformId = sanitizePlatformId(rawPlatformId);

      if (!code) {
        setStatus('error');
        setMessage('Missing authorization code from GitHub.');
        setTimeout(() => navigate('/code-review-connect'), 3000);
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');

        // include platform_id in callback URL only if present and valid
        const callbackUrl =
          `${API_BASE_URL}/auth/github/callback/?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}` +
          (platformId ? `&platform_id=${encodeURIComponent(platformId)}` : '');

        const cbResp = await fetch(callbackUrl, {
          method: 'GET',
          credentials: 'include',
          headers: token ? { 'Authorization': `Token ${token}` } : undefined,
        });

        const cbData = await safeParseJson(cbResp);

        if (!cbResp.ok) {
          const errMsg = cbData?.error || cbData?.detail || `Callback failed (status ${cbResp.status})`;
          setStatus('error');
          setMessage(errMsg);
          
          // Check if backend is trying to redirect to GitHub install
          if (cbResp.redirected && cbResp.url?.includes('github.com/apps/')) {
            window.location.href = cbResp.url;
            return;
          }
          
          if (cbData?.install_url) {
            window.location.href = cbData.install_url;
            return;
          }
          setTimeout(() => navigate('/code-review-connect'), 3500);
          return;
        }

        // Callback successful, redirect to repositories
        setStatus('success');
        setMessage('GitHub connected. Redirecting to repositories...');
        setTimeout(() => navigate('/code-review-connect'), 1200);
        
      } catch (err) {
        setStatus('error');
        setMessage('Network error during GitHub callback processing');
        setTimeout(() => navigate('/code-review-connect'), 3000);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="w-5 h-5 text-green-600" />}
            {status === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}

            {status === 'loading' && 'Setting up GitHub App...'}
            {status === 'success' && 'Installation Complete!'}
            {status === 'error' && 'Installation Failed'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>

          {status === 'loading' && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
              <p className="text-xs text-muted-foreground">
                Configuring GitHub App installation...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <div className="text-sm text-green-600">
                ✓ Installation processed<br/>
                ✓ Verifying installation status
              </div>
              <p className="text-xs text-green-600">
                Redirecting to repository page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <p className="text-xs text-red-600">
              Redirecting back to connection page...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GitHubCallback;
