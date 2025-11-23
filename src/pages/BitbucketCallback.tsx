import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const BitbucketCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing Bitbucket OAuth callback...');

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

    // Validate/sanitize platform id (accept only UUIDs)
    const sanitizePlatformId = (raw: string | null) => {
      if (!raw) return null;
      const trimmed = raw.trim();
      if (!trimmed || trimmed === "null" || trimmed === "undefined") return null;
      // UUID v1-5 pattern (case-insensitive)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(trimmed) ? trimmed : null;
    };

    // Decode state parameter to extract platform_id
    const decodeState = (state: string | null): string | null => {
      if (!state) return null;
      try {
        const decoded = atob(state);
        const parsed = JSON.parse(decoded);
        return sanitizePlatformId(parsed.platform_id);
      } catch (e) {
        console.error("Failed to decode state:", e);
        return null;
      }
    };

    const handleCallback = async () => {
      const code = searchParams.get('code');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');
      const state = searchParams.get('state');

      // Check for OAuth errors from Bitbucket first
      if (error) {
        setStatus('error');
        const decodedErrorDescription = errorDescription 
          ? decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          : 'Unknown error occurred during Bitbucket authorization';
        
        // Provide user-friendly error messages
        let userMessage = decodedErrorDescription;
        if (error === 'invalid_scope') {
          userMessage = `Invalid OAuth scope requested: ${decodedErrorDescription}. Please contact support or check your Bitbucket app configuration.`;
        } else if (error === 'access_denied') {
          userMessage = 'Authorization was denied. Please try again and grant the necessary permissions.';
        } else if (error === 'server_error') {
          userMessage = 'Bitbucket server error occurred. Please try again later.';
        }
        
        setMessage(userMessage);
        setTimeout(() => navigate('/code-review-connect'), 5000);
        return;
      }

      // Extract platform_id from state (base64 encoded JSON) or URL params
      const statePlatformId = decodeState(state);
      const urlPlatformId = searchParams.get('platform_id');
      const storagePlatformId = localStorage.getItem('selected_platform_id');
      const rawPlatformId = statePlatformId || urlPlatformId || storagePlatformId || null;
      const platformId = sanitizePlatformId(rawPlatformId);

      if (!code) {
        setStatus('error');
        setMessage('Missing authorization code from Bitbucket. The authorization may have been cancelled or failed.');
        setTimeout(() => navigate('/code-review-connect'), 3000);
        return;
      }

      try {
        const token = localStorage.getItem('auth_token');

        // Build callback URL with code, state, and platform_id
        const callbackUrl =
          `${API_BASE_URL}/bitbucket/oauth/callback/?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state || '')}` +
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
          setTimeout(() => navigate('/code-review-connect'), 3500);
          return;
        }

        // Callback successful, redirect to repositories
        setStatus('success');
        setMessage('Bitbucket connected successfully! Redirecting to repositories...');
        setTimeout(() => navigate('/code-review-connect'), 1200);
        
      } catch (err) {
        setStatus('error');
        setMessage('Network error during Bitbucket callback processing');
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

            {status === 'loading' && 'Connecting to Bitbucket...'}
            {status === 'success' && 'Connection Complete!'}
            {status === 'error' && 'Connection Failed'}
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
                Processing Bitbucket OAuth callback...
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="space-y-2">
              <div className="text-sm text-green-600">
                ✓ OAuth token exchanged<br/>
                ✓ Bitbucket account connected
              </div>
              <p className="text-xs text-green-600">
                Redirecting to repository page...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-2">
              <p className="text-xs text-red-600">
                {message}
              </p>
              <p className="text-xs text-muted-foreground">
                Redirecting back to connection page...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BitbucketCallback;

