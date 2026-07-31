import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL, cacheInvalidate } from '@/services/api';
import { usePlatform } from '@/contexts/PlatformContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Shield,
  Cloud,
  Server,
  Copy,
  Check,
  Upload,
  Download,
  CheckCircle2,
  Globe,
  Wifi,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import HeimdallAILogo from '@/components/HeimdallAILogo';

const HEIMDALL_PUBLIC_IP = '165.245.217.132';

const platforms = [
  // { id: 'aws', name: 'Amazon Web Services', icon: Cloud, color: 'from-orange-500 to-yellow-500' },
  // { id: 'gcp', name: 'Google Cloud Platform', icon: Cloud, color: 'from-blue-500 to-green-500' },
  // { id: 'azure', name: 'Microsoft Azure', icon: Cloud, color: 'from-blue-600 to-purple-600' },
  // { id: 'kubernetes', name: 'Kubernetes', icon: Container, color: 'from-blue-500 to-cyan-500' },
  // { id: 'on-prem', name: 'On-Premises', icon: Server, color: 'from-gray-600 to-slate-600' },
];

const osOptions = [
  { id: 'linux', name: 'Linux', icon: Server },
  { id: 'windows', name: 'Windows', icon: Cloud },
];

const linuxTools = [
  { id: 'curl', name: 'cURL' },
  { id: 'wget', name: 'Wget' },
];

const selfManagedStepLabels = [
  { step: 1, title: 'Choose Setup', description: 'Managed or self-managed' },
  { step: 2, title: 'Platform Setup', description: 'Environment and app details' },
  { step: 3, title: 'API Docs', description: 'Ports and collection upload' },
  { step: 4, title: 'Install WAF', description: 'Generate install command' },
];

const managedStepLabels = [
  { step: 1, title: 'Choose Setup', description: 'Managed or self-managed' },
  { step: 2, title: 'Origin Config', description: 'Your app URL and hostname' },
  { step: 3, title: 'DNS Setup', description: 'Point your domain at Heimdall' },
  { step: 4, title: 'Verify DNS', description: 'Confirm and go live' },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [installScriptUrl, setInstallScriptUrl] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [deploymentType, setDeploymentType] = useState('saas');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [collectionType, setCollectionType] = useState('');
  const [collectionData, setCollectionData] = useState<Record<string, unknown> | null>(null);
  const [applicationUrl, setApplicationUrl] = useState('');
  const [listeningPort, setListeningPort] = useState('8000');
  const [forwardedPort, setForwardedPort] = useState('8080');
  const [copied, setCopied] = useState(false);
  const [selectedOS, setSelectedOS] = useState<'linux' | 'windows'>('linux');
  const [selectedTool, setSelectedTool] = useState<'curl' | 'wget'>('curl');
  const [installCommandLinux, setInstallCommandLinux] = useState<string | null>(null);
  const [installCommandWindows, setInstallCommandWindows] = useState<string | null>(null);

  // Managed WAF state
  const [wafType, setWafType] = useState<'self-managed' | 'managed' | null>(null);
  const [managedPlatformName, setManagedPlatformName] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [protectedHostname, setProtectedHostname] = useState('');
  const [managedEnvironment, setManagedEnvironment] = useState('production');
  const [managedPlatformId, setManagedPlatformId] = useState<string | null>(null);
  const [dnsVerifyResult, setDnsVerifyResult] = useState<{ verified: boolean; message: string; resolved_to?: string[]; probe_success?: boolean; probe_message?: string } | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [managedLoading, setManagedLoading] = useState(false);
  const [managedError, setManagedError] = useState<string | null>(null);
  const [detectingOrigin, setDetectingOrigin] = useState(false);
  const [originAutoDetected, setOriginAutoDetected] = useState(false);
  const detectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-detect origin URL from DNS A record when protected hostname changes
  useEffect(() => {
    if (detectTimerRef.current) clearTimeout(detectTimerRef.current);
    const hostname = protectedHostname.trim();
    if (!hostname || !hostname.includes('.')) { setOriginAutoDetected(false); return; }
    detectTimerRef.current = setTimeout(async () => {
      setDetectingOrigin(true);
      try {
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(hostname)}&type=A`);
        const data = await res.json();
        const aRecord = data?.Answer?.find((r: any) => r.type === 1);
        if (aRecord?.data) {
          setDestinationUrl(`http://${aRecord.data}`);
          setOriginAutoDetected(true);
        }
      } catch { /* silent — user can fill manually */ }
      finally { setDetectingOrigin(false); }
    }, 800);
    return () => { if (detectTimerRef.current) clearTimeout(detectTimerRef.current); };
  }, [protectedHostname]);

  const navigate = useNavigate();
  const { setSelectedPlatformId } = usePlatform();

  const API_URL = `${API_BASE_URL}/platforms/`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);
          setCollectionData(json);
          if (json.openapi || json.swagger) {
            setCollectionType('openapi');
          } else if (json.info && json.item) {
            setCollectionType('postman');
          } else {
            setCollectionType('');
          }
        } catch {
          setCollectionType('');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleManagedStep2 = async () => {
    setManagedLoading(true);
    setManagedError(null);
    const token = localStorage.getItem('auth_token');

    try {
      // Create the platform first
      const formData = new FormData();
      formData.append('name', managedPlatformName);
      formData.append('environment', managedEnvironment);
      formData.append('deployment_type', 'saas');
      formData.append('status', 'active');
      formData.append('application_url', destinationUrl);
      formData.append('listening_port', '80');
      formData.append('forwarded_port', '80');

      const platformRes = await fetch(`${API_BASE_URL}/platforms/`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: token ? { Authorization: `Token ${token}` } : {},
      });

      if (!platformRes.ok) {
        const err = await platformRes.json().catch(() => ({}));
        throw new Error(JSON.stringify(err));
      }

      const platformData = await platformRes.json();
      const platformObj = platformData.platform?.id ? platformData.platform : platformData;
      const platformId = platformObj.id;

      if (!platformId) throw new Error('Platform created but no ID returned.');

      // Store the platform in local state and cache
      const entry = {
        id: platformObj.id,
        name: platformObj.name,
        environment: platformObj.environment,
        deployment_type: platformObj.deployment_type,
        status: platformObj.status || 'active',
        created_at: platformObj.created_at,
        total_requests: 0,
        blocked_threats: 0,
        active_endpoints: 0,
      };
      const existing = localStorage.getItem('user_platforms');
      const list = existing ? JSON.parse(existing) : [];
      const deduped = list.filter((p: { id: string }) => p.id !== entry.id);
      deduped.push(entry);
      localStorage.setItem('user_platforms', JSON.stringify(deduped));
      setManagedPlatformId(platformId);

      // Store the managed destination
      const destRes = await fetch(`${API_BASE_URL}/platforms/${platformId}/managed-destination/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({ destination_url: destinationUrl, protected_hostname: protectedHostname }),
      });

      if (!destRes.ok) {
        const err = await destRes.json().catch(() => ({}));
        throw new Error(JSON.stringify(err));
      }

      // Set selected platform AFTER is_managed is set on backend, and bust the cache
      cacheInvalidate(`platform:${platformId}`);
      setSelectedPlatformId(platformId);
      setCurrentStep(3);
    } catch (err: unknown) {
      setManagedError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setManagedLoading(false);
    }
  };

  const handleVerifyDNS = async () => {
    if (!managedPlatformId) return;
    setVerifying(true);
    setDnsVerifyResult(null);
    const token = localStorage.getItem('auth_token');

    try {
      const res = await fetch(`${API_BASE_URL}/platforms/${managedPlatformId}/verify-dns/`, {
        method: 'POST',
        credentials: 'include',
        headers: token ? { Authorization: `Token ${token}` } : {},
      });
      const data = await res.json();
      setDnsVerifyResult(data);
      if (data.verified) setCurrentStep(4);
    } catch {
      setDnsVerifyResult({ verified: false, message: 'Network error. Please try again.' });
    } finally {
      setVerifying(false);
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      if (wafType === 'managed' && currentStep === 2) {
        handleManagedStep2();
        return;
      }
      if (wafType === 'managed' && currentStep === 3) {
        handleVerifyDNS();
        return;
      }
      if (currentStep === 3) {
        const formData = new FormData();
        formData.append('name', platformName);
        formData.append('environment', environment);
        formData.append('deployment_type', deploymentType);
        formData.append('status', 'active');
        formData.append('listening_port', listeningPort);
        formData.append('forwarded_port', forwardedPort);
        formData.append('application_url', applicationUrl);

        if (uploadedFile && collectionType) {
          formData.append('collection_type', collectionType);
          formData.append('collection_file', uploadedFile);
        } else if (collectionData && collectionType) {
          formData.append('collection_type', collectionType);
          formData.append('collection_data', JSON.stringify(collectionData));
        }

        const token = localStorage.getItem('auth_token');
        fetch(API_URL, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: token ? { Authorization: `Token ${token}` } : {},
        })
          .then(async (res) => {
            if (!res.ok) {
              let errDetail = 'Unknown error';
              try {
                const errJson = await res.json();
                errDetail = JSON.stringify(errJson, null, 2);
              } catch {
                errDetail = await res.text();
              }
              throw new Error(errDetail);
            }
            return res.json();
          })
          .then((data) => {
            // Safely extract the platform object — API may return { platform: {...}, install_command_linux: "..." }
            // or the platform directly at the top level. Prefer data.platform only if it has a real id.
            const platformObj = (data.platform && data.platform.id) ? data.platform : data;
            const platformId = platformObj.id;

            if (!platformId) {
              console.error('Platform creation response missing id:', data);
              alert('Platform was created but the server response was unexpected. Please check the Workspaces page.');
              return;
            }

            // Build a normalized entry with the exact shape Platforms.tsx + Dashboard.tsx expect.
            const platformEntry = {
              id: platformObj.id,
              name: platformObj.name,
              environment: platformObj.environment,
              deployment_type: platformObj.deployment_type,
              status: platformObj.status || 'active',
              created_at: platformObj.created_at,
              total_requests: platformObj.total_requests || 0,
              blocked_threats: platformObj.blocked_threats || 0,
              active_endpoints: platformObj.active_endpoints || 0,
            };

            const existingPlatforms = localStorage.getItem('user_platforms');
            const storedList: typeof platformEntry[] = existingPlatforms ? JSON.parse(existingPlatforms) : [];
            // Remove any stale entry for the same id before pushing the fresh one.
            const deduped = storedList.filter((p) => p.id !== platformEntry.id);
            deduped.push(platformEntry);
            localStorage.setItem('user_platforms', JSON.stringify(deduped));

            setSelectedPlatformId(platformId);
            // Install commands may sit at top level or inside platformObj — check both.
            setInstallCommandLinux(data.install_command_linux || platformObj.install_command_linux || null);
            setInstallCommandWindows(data.install_command_windows || platformObj.install_command_windows || null);
            setInstallScriptUrl(data.install_script_url || platformObj.install_script_url || null);
            setCurrentStep(currentStep + 1);
          })
          .catch((err) => {
            alert(`Error: ${err.message}`);
            console.error('Full error:', err);
          });
      } else {
        setCurrentStep(currentStep + 1);
      }
    } else {
      const selectedPlatformId = localStorage.getItem('selected_platform_id');
      if (selectedPlatformId) {
        navigate(`/platforms/${selectedPlatformId}`);
      } else {
        navigate('/platforms');
      }
    }
  };

  const canProceed = () => {
    if (wafType === 'managed') {
      switch (currentStep) {
        case 1: return wafType !== null;
        case 2: return managedPlatformName.trim() !== '' && destinationUrl.trim() !== '' && protectedHostname.trim() !== '';
        case 3: return true;
        case 4: return true;
        default: return false;
      }
    }
    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return platformName.trim() !== '';
      case 3:
        return true;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const getInstallCommand = () => {
    if (selectedOS === 'linux') {
      if (selectedTool === 'curl') {
        return installCommandLinux || '...';
      }

      if (installCommandLinux) {
        const curlMatch = installCommandLinux.match(
          /curl\s+-L\s+([^\s]+)\s+-o\s+install\.sh\s+&&\s+chmod\s+\+x\s+install\.sh\s+&&\s+\.\/install\.sh\s+(.+)/
        );
        if (curlMatch) {
          const url = curlMatch[1];
          const args = curlMatch[2];
          return `wget ${url} -O install.sh && chmod +x install.sh && ./install.sh ${args}`;
        }
      }
      return '...';
    } else {
      return installCommandWindows || '...';
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_30%),linear-gradient(to_bottom_right,#f8fafc,#e0f2fe)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_28%),linear-gradient(to_bottom_right,#0f172a,#111827)] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <Card className="overflow-hidden rounded-[28px] border border-slate-200/60 bg-white/90 shadow-2xl backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/90">
          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_30%)]" />
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <HeimdallAILogo size={28} inverted />
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-blue-100">Smartcomply Heimdall</p>
                    <p className="text-sm font-medium text-white">Guided platform onboarding</p>
                  </div>
                </div>

                <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Welcome to Smartcomply Heimdall
                </h1>
                <p className="mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
                  Set up your security platform, connect your API documentation, and install WAF protection in a clean four-step flow.
                </p>

                <div className="mt-6 max-w-md">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium uppercase tracking-wide text-blue-100">
                    <span>Progress</span>
                    <span>Step {currentStep} of 4</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/20">
                    <div
                      className="h-full rounded-full bg-white transition-all duration-300"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/45 px-5 py-4 backdrop-blur-md">
                <p className="text-xs uppercase tracking-wide text-blue-100">Current Step</p>
                <p className="mt-2 text-xl font-semibold text-white">
                  {currentStep === 1 && 'Choose Setup'}
                  {currentStep === 2 && (wafType === 'managed' ? 'Origin Config' : 'Platform Setup')}
                  {currentStep === 3 && (wafType === 'managed' ? 'DNS Setup' : 'Upload API Docs')}
                  {currentStep === 4 && (wafType === 'managed' ? 'Verify DNS' : 'Install WAF')}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
              <div className="space-y-3">
                {(wafType === 'managed' ? managedStepLabels : selfManagedStepLabels).map(({ step, title, description }) => {
                  const isActive = step === currentStep;
                  const isComplete = step < currentStep;

                  return (
                    <div
                      key={step}
                      className={`rounded-2xl border p-4 transition-all ${
                        isActive
                          ? 'border-blue-300 bg-blue-50/80 shadow-sm dark:border-blue-500/30 dark:bg-blue-500/10'
                          : isComplete
                            ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                            : 'border-slate-200/60 bg-slate-50/80 dark:border-slate-700/60 dark:bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : isComplete
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {isComplete ? <CheckCircle2 className="h-4 w-4" /> : step}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="min-w-0">
                {currentStep === 1 && (
                  <Card className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">How do you want to deploy?</CardTitle>
                      <CardDescription>
                        Choose whether Heimdall hosts the WAF for you, or you install it on your own server.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <Card
                          className={`cursor-pointer rounded-2xl border-2 transition-all hover:shadow-md ${
                            wafType === 'self-managed'
                              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/10'
                              : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'
                          }`}
                          onClick={() => setWafType('self-managed')}
                        >
                          <CardContent className="p-6">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800">
                              <Server className="h-6 w-6 text-slate-600 dark:text-slate-300" />
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">Self-Managed</h4>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Install the WAF on your own server. You manage Docker and infrastructure.
                            </p>
                            {wafType === 'self-managed' && (
                              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                                <CheckCircle2 className="h-4 w-4" /> Selected
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        <Card
                          className={`cursor-pointer rounded-2xl border-2 transition-all hover:shadow-md ${
                            wafType === 'managed'
                              ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-500/10'
                              : 'border-slate-200 hover:border-blue-300 dark:border-slate-700'
                          }`}
                          onClick={() => setWafType('managed')}
                        >
                          <CardContent className="p-6">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-500/20">
                              <Globe className="h-6 w-6 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-slate-900 dark:text-white">Managed by Heimdall</h4>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              We host the WAF. Just point your domain's DNS at us. No Docker, no install.
                            </p>
                            {wafType === 'managed' && (
                              <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                                <CheckCircle2 className="h-4 w-4" /> Selected
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentStep === 2 && wafType === 'managed' && (
                  <Card className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Configure Your Origin</CardTitle>
                      <CardDescription>
                        Tell us your real server URL and the domain you want to protect.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="managed-platform-name">Platform Name</Label>
                        <Input
                          id="managed-platform-name"
                          placeholder="e.g., Heimdall Production"
                          value={managedPlatformName}
                          onChange={(e) => setManagedPlatformName(e.target.value)}
                          className="rounded-xl"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="protected-hostname">Protected Hostname</Label>
                        <Input
                          id="protected-hostname"
                          placeholder="e.g., yourdomain.com or app.heimdallsecurity.io"
                          value={protectedHostname}
                          onChange={(e) => {
                            let val = e.target.value.trim();
                            try { val = new URL(val).hostname; } catch {}
                            val = val.replace(/\/+$/, '');
                            setProtectedHostname(val);
                          }}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-slate-500">Hostname only — no https:// or trailing slash. e.g., yourdomain.com or app.yourdomain.com</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="destination-url">Origin URL</Label>
                          {detectingOrigin && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
                              <Loader2 className="h-3 w-3 animate-spin" /> Detecting…
                            </span>
                          )}
                          {originAutoDetected && !detectingOrigin && (
                            <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                              <Sparkles className="h-3 w-3" /> Auto-detected
                            </span>
                          )}
                        </div>
                        <Input
                          id="destination-url"
                          placeholder="e.g., https://api.heimdallsecurity.io or http://192.168.1.5:8080"
                          value={destinationUrl}
                          onChange={(e) => { setDestinationUrl(e.target.value); setOriginAutoDetected(false); }}
                          className="rounded-xl"
                        />
                        <p className="text-xs text-slate-500">Your real server. Clean traffic gets forwarded here after the WAF inspects it. Auto-detected from your hostname — you can also enter it manually.</p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                        <Label className="mb-3 block">Environment</Label>
                        <RadioGroup value={managedEnvironment} onValueChange={setManagedEnvironment} className="space-y-3">
                          {['production', 'staging', 'development'].map((env) => (
                            <div key={env} className="flex items-center space-x-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                              <RadioGroupItem value={env} id={`managed-${env}`} />
                              <Label htmlFor={`managed-${env}`} className="capitalize">{env}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>

                      {managedError && (
                        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {managedError}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {currentStep === 3 && wafType === 'managed' && (
                  <Card className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Point Your DNS at Heimdall</CardTitle>
                      <CardDescription>
                        Add an A record for <strong>{protectedHostname}</strong> in your domain registrar or DNS provider.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
                        <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-300">Add this DNS record:</p>
                        <div className="grid grid-cols-3 gap-3 text-sm">
                          {[
                            { label: 'Type', value: 'A' },
                            { label: 'Name / Host', value: protectedHostname || 'your hostname' },
                            { label: 'Value / Points to', value: HEIMDALL_PUBLIC_IP },
                          ].map(({ label, value }) => (
                            <div key={label} className="rounded-xl border border-blue-100 bg-white p-3 dark:border-blue-500/10 dark:bg-slate-900/60">
                              <p className="text-xs text-slate-500">{label}</p>
                              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-white break-all">{value}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs text-slate-500">Set TTL to 300. Changes can take up to 48 hours to propagate.</p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Once added, click <strong>Verify DNS</strong> below. Not ready yet? Click <strong>Proceed to Dashboard</strong> — we'll detect it automatically.
                        </p>
                      </div>

                      {dnsVerifyResult && !dnsVerifyResult.verified && (
                        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-400">
                          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                          {dnsVerifyResult.message}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {currentStep === 4 && wafType === 'managed' && (
                  <Card className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">
                        {dnsVerifyResult?.verified ? '🎉 You\'re Protected!' : 'Verification'}
                      </CardTitle>
                      <CardDescription>
                        {dnsVerifyResult?.verified
                          ? `${protectedHostname} is now routing through Heimdall WAF.`
                          : 'DNS verification result'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {dnsVerifyResult?.verified ? (
                        <div className="space-y-4">
                          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 text-center dark:border-emerald-500/20 dark:bg-emerald-500/10">
                            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20">
                              <Wifi className="h-7 w-7 text-emerald-600" />
                            </div>
                            <p className="font-semibold text-emerald-800 dark:text-emerald-300">DNS Verified</p>
                            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                              Traffic to <strong>{protectedHostname}</strong> is now intercepted and inspected by Heimdall before reaching your origin.
                            </p>
                          </div>

                          {dnsVerifyResult?.probe_success ? (
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/10">
                              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">✅ WAF Live</p>
                              <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">{dnsVerifyResult.probe_message}</p>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                              <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">⏳ WAF Not Yet Active</p>
                              <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">{dnsVerifyResult?.probe_message || 'WAF container is not running yet.'}</p>
                            </div>
                          )}

                          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-4 dark:border-slate-700/60 dark:bg-slate-800/30">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Summary</p>
                            <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                              <p>Protected domain: <span className="font-mono">{protectedHostname}</span></p>
                              <p>Origin server: <span className="font-mono">{destinationUrl}</span></p>
                              <p>WAF IP: <span className="font-mono">{HEIMDALL_PUBLIC_IP}</span></p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-6 text-center dark:border-red-500/20 dark:bg-red-500/10">
                          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
                          <p className="font-semibold text-red-700 dark:text-red-400">Verification Failed</p>
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                            {dnsVerifyResult?.message || 'DNS has not propagated yet.'}
                          </p>
                          <Button
                            className="mt-4 rounded-xl"
                            variant="outline"
                            onClick={() => { setCurrentStep(3); setDnsVerifyResult(null); }}
                          >
                            Go back and try again
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {currentStep === 2 && wafType !== 'managed' && (
                  <Card className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Create Your Platform</CardTitle>
                      <CardDescription>
                        Configure your security platform settings.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                        <div className="space-y-5 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                          <div className="space-y-2">
                            <Label htmlFor="platform-name">Platform Name</Label>
                            <Input
                              id="platform-name"
                              placeholder="e.g., Production API Gateway"
                              value={platformName}
                              onChange={(e) => setPlatformName(e.target.value)}
                              className="rounded-xl"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="application-url">Application URL</Label>
                            <Input
                              id="application-url"
                              placeholder="e.g., https://api.example.com"
                              value={applicationUrl}
                              onChange={(e) => setApplicationUrl(e.target.value)}
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-5">
                          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                            <Label className="mb-3 block">Environment</Label>
                            <RadioGroup value={environment} onValueChange={setEnvironment} className="space-y-3">
                              <div className="flex items-center space-x-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <RadioGroupItem value="production" id="production" />
                                <Label htmlFor="production">Production</Label>
                              </div>
                              <div className="flex items-center space-x-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <RadioGroupItem value="staging" id="staging" />
                                <Label htmlFor="staging">Staging</Label>
                              </div>
                              <div className="flex items-center space-x-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <RadioGroupItem value="development" id="development" />
                                <Label htmlFor="development">Development</Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                            <Label className="mb-3 block">Deployment Type</Label>
                            <RadioGroup value={deploymentType} onValueChange={setDeploymentType} className="space-y-3">
                              <div className="flex items-center space-x-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <RadioGroupItem value="saas" id="saas" />
                                <Label htmlFor="saas">SaaS (Managed)</Label>
                              </div>
                              <div className="flex items-center space-x-2 rounded-xl border border-slate-200/60 bg-white/80 px-3 py-3 dark:border-slate-700/60 dark:bg-slate-900/60">
                                <RadioGroupItem value="on-prem" id="on-prem" />
                                <Label htmlFor="on-prem">On-Premises</Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentStep === 3 && wafType !== 'managed' && (
                  <Card className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Upload API Documentation</CardTitle>
                      <CardDescription>
                        Upload your API documentation (OpenAPI/Postman) to enable endpoint detection and protection.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
                        <div className="space-y-5 rounded-2xl border border-slate-200/60 bg-slate-50/70 p-5 dark:border-slate-700/60 dark:bg-slate-800/30">
                          <div className="space-y-2">
                            <Label>Listening Port</Label>
                            <Input
                              type="number"
                              min="1"
                              max="65535"
                              value={listeningPort}
                              onChange={(e) => setListeningPort(e.target.value)}
                              placeholder="8000"
                              className="rounded-xl"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Forwarded Port</Label>
                            <Input
                              type="number"
                              min="1"
                              max="65535"
                              value={forwardedPort}
                              onChange={(e) => setForwardedPort(e.target.value)}
                              placeholder="8080"
                              className="rounded-xl"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center dark:border-slate-700 dark:bg-slate-800/30">
                          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
                            <Upload className="h-8 w-8 text-blue-500" />
                          </div>

                          <div>
                            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
                              API Documentation
                            </h4>
                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                              Upload OpenAPI or Postman collection (.json)
                            </p>
                          </div>

                          <input
                            type="file"
                            accept=".json,.yaml,.yml"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                          />

                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('file-upload')?.click()}
                            className="rounded-xl"
                          >
                            Choose File
                          </Button>

                          {uploadedFile && (
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                              <span className="font-medium">Uploaded:</span> {uploadedFile.name} ({collectionType ? collectionType : 'Unknown'})
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {currentStep === 4 && wafType !== 'managed' && (
                  <Card className="rounded-3xl border border-slate-200/60 bg-white shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">Install WAF Protection</CardTitle>
                      <CardDescription>
                        Select your operating system and copy the installation command below. You can choose between cURL and Wget for Linux.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div className="flex flex-wrap justify-center gap-3">
                        {osOptions.map((os) => (
                          <Button
                            key={os.id}
                            variant={selectedOS === os.id ? 'default' : 'outline'}
                            onClick={() => {
                              setSelectedOS(os.id as 'linux' | 'windows');
                              setSelectedTool('curl');
                            }}
                            className="rounded-xl"
                          >
                            <os.icon className="mr-2 h-4 w-4" />
                            {os.name}
                          </Button>
                        ))}
                      </div>

                      {selectedOS === 'linux' && (
                        <div className="flex flex-wrap justify-center gap-2">
                          {linuxTools.map((tool) => (
                            <Button
                              key={tool.id}
                              variant={selectedTool === tool.id ? 'default' : 'outline'}
                              onClick={() => setSelectedTool(tool.id as 'curl' | 'wget')}
                              size="sm"
                              className="rounded-xl"
                            >
                              {tool.name}
                            </Button>
                          ))}
                        </div>
                      )}

                      <div className="rounded-2xl border border-slate-200/60 bg-slate-950 p-5 text-white dark:border-slate-700/60">
                        <Label className="text-slate-200">
                          Installation Command ({selectedOS === 'linux' ? selectedTool.toUpperCase() : 'cURL for Windows'})
                        </Label>

                        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-4">
                          <code className="block overflow-x-auto text-sm font-mono text-slate-100">
                            {getInstallCommand()}
                          </code>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                            onClick={async () => {
                              const cmd = getInstallCommand();
                              if (cmd && cmd !== '...') {
                                try {
                                  await navigator.clipboard.writeText(cmd);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                } catch (error) {
                                  console.error('Failed to copy command:', error);
                                  const textarea = document.createElement('textarea');
                                  textarea.value = cmd;
                                  document.body.appendChild(textarea);
                                  textarea.select();
                                  document.execCommand('copy');
                                  document.body.removeChild(textarea);
                                  setCopied(true);
                                  setTimeout(() => setCopied(false), 2000);
                                }
                              }
                            }}
                            disabled={!getInstallCommand() || getInstallCommand() === '...'}
                          >
                            {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                            {copied ? 'Copied!' : 'Copy Command'}
                          </Button>

                          {installScriptUrl && (
                            <a
                              href={installScriptUrl}
                              download
                              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-white/90"
                            >
                              <Download className="h-4 w-4" />
                              Download Install Script
                            </a>
                          )}
                        </div>

                        <p className="mt-4 text-xs text-slate-300">
                          This will install Envoy, download the .wasm module from GitHub, and configure it to listen on port 443 while forwarding to port 8000.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <div className="mt-8 flex justify-between border-t border-slate-200/70 pt-6 dark:border-slate-800/70">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                disabled={currentStep === 1 || (currentStep === 4 && (!!installCommandLinux || !!installCommandWindows))}
                className="rounded-xl"
              >
                Previous
              </Button>

              <div className="flex items-center gap-3">
                {wafType === 'managed' && currentStep === 3 && (
                  <Button
                    variant="ghost"
                    className="rounded-xl text-slate-500 hover:text-slate-700"
                    onClick={() => { const pid = localStorage.getItem('selected_platform_id'); navigate(pid ? `/platforms/${pid}` : '/platforms'); }}
                  >
                    Proceed to Dashboard
                  </Button>
                )}
                <Button onClick={handleNext} disabled={!canProceed() || managedLoading || verifying} className="rounded-xl">
                  {wafType === 'managed' && currentStep === 2 && (managedLoading ? 'Saving...' : 'Next')}
                  {wafType === 'managed' && currentStep === 3 && (verifying ? 'Verifying...' : 'Verify DNS')}
                  {wafType === 'managed' && currentStep === 4 && 'Proceed to Dashboard'}
                  {wafType === 'managed' && currentStep === 1 && 'Next'}
                  {wafType !== 'managed' && (currentStep === 4 ? 'Proceed to Dashboard' : 'Next')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
