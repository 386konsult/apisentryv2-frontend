import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/services/api';
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
} from 'lucide-react';

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

const stepLabels = [
  { step: 1, title: 'Choose Platform', description: 'Select deployment target' },
  { step: 2, title: 'Platform Setup', description: 'Environment and app details' },
  { step: 3, title: 'API Docs', description: 'Ports and collection upload' },
  { step: 4, title: 'Install WAF', description: 'Generate install command' },
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

  const handleNext = () => {
    if (currentStep < 4) {
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
            const platformObj = data.platform || data;
            const platformId = platformObj.id;
            const existingPlatforms = localStorage.getItem('user_platforms');
            const platforms = existingPlatforms ? JSON.parse(existingPlatforms) : [];
            platforms.push(platformObj);
            localStorage.setItem('user_platforms', JSON.stringify(platforms));
            setSelectedPlatformId(platformId);
            setInstallCommandLinux(data.install_command_linux || null);
            setInstallCommandWindows(data.install_command_windows || null);
            setInstallScriptUrl(data.install_script_url || null);
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
                  <div className="rounded-xl bg-white/15 p-2.5">
                    <Shield className="h-5 w-5 text-white" />
                  </div>
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
                  {currentStep === 1 && 'Choose Platform'}
                  {currentStep === 2 && 'Platform Setup'}
                  {currentStep === 3 && 'Upload API Docs'}
                  {currentStep === 4 && 'Install WAF'}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 sm:p-8">
            <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
              <div className="space-y-3">
                {stepLabels.map(({ step, title, description }) => {
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
                      <CardTitle className="text-xl">Select Your Platform</CardTitle>
                      <CardDescription>
                        Choose where you&apos;ll deploy Smartcomply Heimdall.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {platforms.length > 0 ? (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          {platforms.map((platform) => (
                            <Card
                              key={platform.id}
                              className={`cursor-pointer rounded-2xl border transition-all hover:shadow-md ${
                                selectedPlatform === platform.id
                                  ? 'ring-2 ring-primary border-primary'
                                  : 'hover:border-primary/50'
                              }`}
                              onClick={() => setSelectedPlatform(platform.id)}
                            >
                              <CardContent className="p-5 text-center">
                                <div className={`mb-4 inline-flex rounded-2xl bg-gradient-to-r ${platform.color} p-4`}>
                                  <platform.icon className="h-6 w-6 text-white" />
                                </div>
                                <h4 className="font-medium text-slate-900 dark:text-white">{platform.name}</h4>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-800/30">
                          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-500/10">
                            <Shield className="h-8 w-8 text-blue-500" />
                          </div>
                          <h4 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Continue With Guided Setup
                          </h4>
                          <p className="mt-2 max-w-lg mx-auto text-sm text-slate-500 dark:text-slate-400">
                            Platform preset cards are currently hidden, but you can continue to create and configure your platform manually in the next step.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {currentStep === 2 && (
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

                {currentStep === 3 && (
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

                {currentStep === 4 && (
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

              <Button onClick={handleNext} disabled={!canProceed()} className="rounded-xl">
                {currentStep === 4 ? 'Proceed to Dashboard' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;
