import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Globe,
  Save,
  Eye,
  EyeOff,
  Lock,
  Terminal,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, API_BASE_URL } from "@/services/api";
import { Shield, Cloud, Server, Container, Copy, Check, Upload, Download } from 'lucide-react';

const Settings = () => {
  const { toast } = useToast();
  const [platformDetails, setPlatformDetails] = useState<any>(null);
  const [isUpdatingPlatform, setIsUpdatingPlatform] = useState(false);
  const [platformFormData, setPlatformFormData] = useState({
    name: "",
    application_url: "",
    listening_port: "",
    forwarded_port: "",
  });

  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const [selectedOS, setSelectedOS] = useState<'linux' | 'windows'>('linux');
  const [selectedTool, setSelectedTool] = useState<'curl' | 'wget'>('curl');

  // Fetch platform details
  useEffect(() => {
    const fetchPlatformDetails = async () => {
      try {
        const platformId = localStorage.getItem("selected_platform_id");
        if (!platformId) throw new Error("No platform selected");
        const details = await apiService.getPlatformDetails(platformId);
        setPlatformDetails(details);
        setPlatformFormData({
          name: details.name || "",
          application_url: details.base_url || "",
          listening_port: details.listening_port || "",
          forwarded_port: details.forwarded_port || "",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to fetch platform details.",
          variant: "destructive",
        });
      }
    };

    fetchPlatformDetails();
  }, [toast]);

  const handlePlatformUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPlatform(true);

    try {
      const platformId = localStorage.getItem("selected_platform_id");
      if (!platformId) throw new Error("No platform selected");

      const payload: Record<string, any> = {};
      if (platformFormData.name) payload.name = platformFormData.name;
      if (platformFormData.application_url) payload.application_url = platformFormData.application_url;
      if (platformFormData.listening_port) payload.listening_port = platformFormData.listening_port;
      if (platformFormData.forwarded_port) payload.forwarded_port = platformFormData.forwarded_port;

      await apiService.updatePlatform(platformId, payload);

      toast({
        title: "Platform Updated",
        description: "Platform details have been successfully updated.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update platform details.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingPlatform(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!passwordData.oldPassword) {
      errors.oldPassword = "Current password is required";
    }
    if (!passwordData.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = "Password must contain uppercase, lowercase, and number";
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem("auth_token");
      const res = await fetch(`${API_BASE_URL}/auth/reset-password/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify({
          old_password: passwordData.oldPassword,
          new_password: passwordData.newPassword,
          new_password_confirm: passwordData.confirmPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || data.message || "Failed to change password");
      }

      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated",
        variant: "default",
      });

      // Reset form
      setPasswordData({
        oldPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Configure your platform preferences and security settings
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Platform Details
                </CardTitle>
                <CardDescription>
                  View and update your platform details
                </CardDescription>
              </CardHeader>
              <CardContent>
                {platformDetails ? (
                  <form onSubmit={handlePlatformUpdate} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="platformName">Platform Name</Label>
                      <Input
                        id="platformName"
                        value={platformFormData.name || platformDetails.name}
                        onChange={(e) =>
                          setPlatformFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="applicationUrl">Base URL</Label>
                      <Input
                        id="applicationUrl"
                        value={platformFormData.application_url}
                        onChange={(e) =>
                          setPlatformFormData((prev) => ({
                            ...prev,
                            application_url: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="listeningPort">Listening Port</Label>
                      <Input
                        id="listeningPort"
                        type="number"
                        value={platformFormData.listening_port}
                        onChange={(e) =>
                          setPlatformFormData((prev) => ({
                            ...prev,
                            listening_port: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="forwardedPort">Forwarded Port</Label>
                      <Input
                        id="forwardedPort"
                        type="number"
                        value={platformFormData.forwarded_port}
                        onChange={(e) =>
                          setPlatformFormData((prev) => ({
                            ...prev,
                            forwarded_port: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        className="gradient-primary"
                        disabled={isUpdatingPlatform}
                      >
                        {isUpdatingPlatform ? "Updating..." : "Update Platform"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <p>Loading platform details...</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Installation Commands
                </CardTitle>
                <CardDescription>
                  Use the following commands to install the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Select Your Operating System</h3>
                  <p className="text-muted-foreground">
                    Choose your OS and copy the installation command below.
                  </p>
                </div>
                <div className="flex justify-center gap-4 mb-4">
                  <Button
                    variant={selectedOS === 'linux' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedOS('linux');
                      setSelectedTool('curl');
                    }}
                    className="flex items-center gap-2"
                  >
                    <Server className="h-5 w-5" />
                    Linux
                  </Button>
                  <Button
                    variant={selectedOS === 'windows' ? 'default' : 'outline'}
                    onClick={() => setSelectedOS('windows')}
                    className="flex items-center gap-2"
                  >
                    <Cloud className="h-5 w-5" />
                    Windows
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>
                    Installation Command ({selectedOS === 'linux' ? 'Linux' : 'Windows'})
                  </Label>
                  <div className="bg-muted p-4 rounded-lg flex items-center">
                    <code className="text-sm font-mono flex-1">
                      {platformDetails
                        ? selectedOS === 'linux'
                          ? `curl -L https://raw.githubusercontent.com/Wired-Assurance/installation-script/main/install.sh -o install.sh && chmod +x install.sh && ./install.sh ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port}`
                          : `curl -L https://raw.githubusercontent.com/Wired-Assurance/installation-script/main/install.bat -o install.bat && install.bat ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port}`
                        : 'Loading...'}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => {
                        const command = platformDetails
                          ? selectedOS === 'linux'
                            ? `curl -L https://raw.githubusercontent.com/Wired-Assurance/installation-script/main/install.sh -o install.sh && chmod +x install.sh && ./install.sh ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port}`
                            : `curl -L https://raw.githubusercontent.com/Wired-Assurance/installation-script/main/install.bat -o install.bat && install.bat ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port}`
                          : '';
                        navigator.clipboard.writeText(command);
                        toast({
                          title: "Copied to Clipboard",
                          description: "The installation command has been copied.",
                          variant: "default",
                        });
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    This command will install Envoy, download the .wasm module, and configure it to listen on the specified ports.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your account password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password */}
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">
                    Current Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="oldPassword"
                      type={showOldPassword ? "text" : "password"}
                      placeholder="Enter your current password"
                      value={passwordData.oldPassword}
                      onChange={(e) => {
                        setPasswordData(prev => ({ ...prev, oldPassword: e.target.value }));
                        if (passwordErrors.oldPassword) {
                          setPasswordErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.oldPassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={`pl-8 ${passwordErrors.oldPassword ? 'border-destructive' : ''}`}
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordErrors.oldPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.oldPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">
                    New Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={passwordData.newPassword}
                      onChange={(e) => {
                        setPasswordData(prev => ({ ...prev, newPassword: e.target.value }));
                        if (passwordErrors.newPassword) {
                          setPasswordErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.newPassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={`pl-8 ${passwordErrors.newPassword ? 'border-destructive' : ''}`}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordData.newPassword && (
                    <div className="space-y-1">
                      <ul className="text-xs text-muted-foreground space-y-1 ml-1">
                        <li className={`flex items-center gap-1 ${passwordData.newPassword.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {passwordData.newPassword.length >= 8 ? '✓' : '○'} At least 8 characters
                        </li>
                        <li className={`flex items-center gap-1 ${/(?=.*[a-z])(?=.*[A-Z])/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {/(?=.*[a-z])(?=.*[A-Z])/.test(passwordData.newPassword) ? '✓' : '○'} Uppercase and lowercase letters
                        </li>
                        <li className={`flex items-center gap-1 ${/\d/.test(passwordData.newPassword) ? 'text-green-600 dark:text-green-400' : ''}`}>
                          {/\d/.test(passwordData.newPassword) ? '✓' : '○'} At least one number
                        </li>
                      </ul>
                    </div>
                  )}
                  {passwordErrors.newPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    Confirm New Password <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => {
                        setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }));
                        if (passwordErrors.confirmPassword) {
                          setPasswordErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.confirmPassword;
                            return newErrors;
                          });
                        }
                      }}
                      className={`pl-8 ${passwordErrors.confirmPassword ? 'border-destructive' : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword ? 'border-green-500' : ''}`}
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword && (
                    <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                      ✓ Passwords match
                    </p>
                  )}
                  {passwordErrors.confirmPassword && (
                    <p className="text-xs text-destructive">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    className="gradient-primary"
                    disabled={isChangingPassword}
                  >
                    {isChangingPassword ? (
                      <>
                        <Save className="h-4 w-4 mr-2 animate-spin" />
                        Changing Password...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Change Password
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
