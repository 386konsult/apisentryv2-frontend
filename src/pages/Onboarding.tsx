import apiService from '@/services/api';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Cloud, Server, Container, Copy, Check, Upload, Download } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/services/api';
import { usePlatform } from '@/contexts/PlatformContext';

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

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [installCommandResp, setInstallCommandResp] = useState<string | null>(null);
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

  const installCommand = `curl -sL https://api-shield.com/install.sh | bash`;
  // Backend API endpoint
  const API_URL = `${API_BASE_URL}/platforms/`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // Try to parse JSON for OpenAPI/Postman
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const json = JSON.parse(text);
          setCollectionData(json);
          // Auto-detect type
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
      // If step 3, submit to backend
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
          headers: token ? { 'Authorization': `Token ${token}` } : {},
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
            // Save platform info to localStorage for compatibility
            const platformObj = data.platform || data;
            const platformId = platformObj.id;
            const existingPlatforms = localStorage.getItem('user_platforms');
            const platforms = existingPlatforms ? JSON.parse(existingPlatforms) : [];
            platforms.push(platformObj);
            localStorage.setItem('user_platforms', JSON.stringify(platforms));
            setSelectedPlatformId(platformId);
            // Save install command and script url for step 4
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
      // Step 4: Finish and go to platform details page
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

  // Helper for install command (simulate wget for Linux)
  const getInstallCommand = () => {
    if (selectedOS === 'linux') {
      if (selectedTool === 'curl') {
        return installCommandLinux || '...';
      }
      // Wget version for Linux only
      if (installCommandLinux) {
        const curlMatch = installCommandLinux.match(/curl\s+-L\s+([^\s]+)\s+-o\s+install\.sh\s+&&\s+chmod\s+\+x\s+install\.sh\s+&&\s+\.\/install\.sh\s+(.+)/);
        if (curlMatch) {
          const url = curlMatch[1];
          const args = curlMatch[2];
          return `wget ${url} -O install.sh && chmod +x install.sh && ./install.sh ${args}`;
        }
      }
      return '...';
    } else {
      // Windows always uses curl (no wget option)
      return installCommandWindows || '...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500">
              <Shield className="h-6 w-6 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to API Shield</CardTitle>
          <CardDescription>
            Let's set up your security platform in just a few steps
          </CardDescription>
          {/* Progress indicator */}
          <div className="flex justify-center mt-6">
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`w-3 h-3 rounded-full ${
                    step <= currentStep
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Platform selection */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Select Your Platform</h3>
                <p className="text-muted-foreground">Choose where you'll deploy API Shield</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {platforms.map((platform) => (
                  <Card
                    key={platform.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedPlatform === platform.id
                        ? 'ring-2 ring-primary border-primary'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlatform(platform.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${platform.color} mb-3`}>
                        <platform.icon className="h-6 w-6 text-white" />
                      </div>
                      <h4 className="font-medium">{platform.name}</h4>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Platform config */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Create Your Platform</h3>
                <p className="text-muted-foreground">Configure your security platform settings</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input
                    id="platform-name"
                    placeholder="e.g., Production API Gateway"
                    value={platformName}
                    onChange={(e) => setPlatformName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="application-url">Application URL</Label>
                  <Input
                    id="application-url"
                    placeholder="e.g., https://api.example.com"
                    value={applicationUrl}
                    onChange={(e) => setApplicationUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-3">
                  <Label>Environment</Label>
                  <RadioGroup value={environment} onValueChange={setEnvironment}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="production" id="production" />
                      <Label htmlFor="production">Production</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="staging" id="staging" />
                      <Label htmlFor="staging">Staging</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="development" id="development" />
                      <Label htmlFor="development">Development</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-3">
                  <Label>Deployment Type</Label>
                  <RadioGroup value={deploymentType} onValueChange={setDeploymentType}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="saas" id="saas" />
                      <Label htmlFor="saas">SaaS (Managed)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="on-prem" id="on-prem" />
                      <Label htmlFor="on-prem">On-Premises</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: API doc upload */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Upload API Documentation</h3>
                <p className="text-muted-foreground">Upload your API documentation (OpenAPI/Postman) to enable endpoint detection and protection</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Listening Port</Label>
                  <Input
                    type="number"
                    min="1"
                    max="65535"
                    value={listeningPort}
                    onChange={e => setListeningPort(e.target.value)}
                    placeholder="8000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Forwarded Port</Label>
                  <Input
                    type="number"
                    min="1"
                    max="65535"
                    value={forwardedPort}
                    onChange={e => setForwardedPort(e.target.value)}
                    placeholder="8080"
                  />
                </div>
                <div className="space-y-2">
                  <Label>API Documentation (Optional)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload OpenAPI or Postman collection (.json)
                    </p>
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
                    >
                      Choose File
                    </Button>
                    {uploadedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {uploadedFile.name} ({collectionType ? collectionType : 'Unknown'})
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Install command & OS selection */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Install WAF Protection</h3>
                <p className="text-muted-foreground">
                  Select your operating system and copy the installation command below. You can choose between cURL and Wget for Linux.
                </p>
              </div>
              <div className="space-y-4">
                {/* OS selection tabs (only in step 5) */}
                <div className="flex justify-center gap-4 mb-2">
                  {osOptions.map((os) => (
                    <Button
                      key={os.id}
                      variant={selectedOS === os.id ? 'default' : 'outline'}
                      onClick={() => {
                        setSelectedOS(os.id as 'linux' | 'windows');
                        setSelectedTool('curl');
                      }}
                      className="flex items-center gap-2"
                    >
                      <os.icon className="h-5 w-5" />
                      {os.name}
                    </Button>
                  ))}
                </div>
                {/* Tool selection for Linux only */}
                {selectedOS === 'linux' && (
                  <div className="flex justify-center gap-2 mb-2">
                    {linuxTools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant={selectedTool === tool.id ? 'default' : 'outline'}
                        onClick={() => setSelectedTool(tool.id as 'curl' | 'wget')}
                        size="sm"
                      >
                        {tool.name}
                      </Button>
                    ))}
                  </div>
                )}
                {/* Install command box */}
                <div className="space-y-2">
                  <Label>
                    Installation Command ({selectedOS === 'linux' ? selectedTool.toUpperCase() : 'cURL for Windows'})
                  </Label>
                  <div className="bg-muted p-4 rounded-lg flex items-center">
                    <code className="text-sm font-mono flex-1">
                      {getInstallCommand()}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        const cmd = getInstallCommand();
                        if (cmd && cmd !== '...') {
                          navigator.clipboard.writeText(cmd);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }
                      }}
                      disabled={!getInstallCommand() || getInstallCommand() === '...'}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  {installScriptUrl && (
                    <div className="mt-2 flex justify-center">
                      <a
                        href={installScriptUrl}
                        download
                        className="inline-flex items-center gap-2 px-5 py-2.5 font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-150"
                      >
                        <Download className="h-5 w-5" />
                        <span>Download Install Script</span>
                      </a>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    This will install Envoy, download the .wasm module from GitHub, and configure it to listen on port 443 while forwarding to port 8000.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1 || (currentStep === 4 && (!!installCommandLinux || !!installCommandWindows))}
            >
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === 4 ? 'Proceed to Dashboard' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default Onboarding;
