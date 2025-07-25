
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Shield, Cloud, Server, Container, Copy, Check, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const platforms = [
  // { id: 'aws', name: 'Amazon Web Services', icon: Cloud, color: 'from-orange-500 to-yellow-500' },
  // { id: 'gcp', name: 'Google Cloud Platform', icon: Cloud, color: 'from-blue-500 to-green-500' },
  // { id: 'azure', name: 'Microsoft Azure', icon: Cloud, color: 'from-blue-600 to-purple-600' },
  // { id: 'kubernetes', name: 'Kubernetes', icon: Container, color: 'from-blue-500 to-cyan-500' },
  // { id: 'on-prem', name: 'On-Premises', icon: Server, color: 'from-gray-600 to-slate-600' },
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(2);
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [environment, setEnvironment] = useState('production');
  const [deploymentType, setDeploymentType] = useState('saas');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const installCommand = `curl -sL https://api-shield.com/install.sh | bash`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(installCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      // Create the platform and save to localStorage
      const newPlatform = {
        id: Date.now().toString(), // Simple ID generation
        name: platformName,
        environment,
        deployment_type: deploymentType,
        status: 'active' as const,
        created_at: new Date().toISOString(),
        total_requests: 0,
        blocked_threats: 0,
        active_endpoints: 0,
      };

      // Get existing platforms or create empty array
      const existingPlatforms = localStorage.getItem('user_platforms');
      const platforms = existingPlatforms ? JSON.parse(existingPlatforms) : [];
      
      // Add new platform
      platforms.push(newPlatform);
      localStorage.setItem('user_platforms', JSON.stringify(platforms));
      
      // Set as selected platform
      localStorage.setItem('selected_platform_id', newPlatform.id);
      
      navigate('/dashboard');
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPlatform !== '';
      case 2:
        return platformName.trim() !== '';
      case 3:
        return true;
      default:
        return false;
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
              {[1, 2, 3].map((step) => (
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

          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Install WAF Protection</h3>
                <p className="text-muted-foreground">Upload your API documentation and install the WAF</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>API Documentation (Optional)</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Upload OpenAPI/Swagger specification
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
                        ✓ {uploadedFile.name}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Installation Command</Label>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm font-mono">{installCommand}</code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={handleCopyCommand}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied!' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This will install Envoy, download the .wasm module from GitHub, 
                    and configure it to listen on port 443 while forwarding to port 8000.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
            >
              {currentStep === 3 ? 'Proceed to Dashboard' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Onboarding;
