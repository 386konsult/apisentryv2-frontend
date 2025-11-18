
import { useState } from "react";
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
  Shield,
  Globe,
  Save,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/services/api";

const Settings = () => {
  const { toast } = useToast();
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrors({});

    // Validation
    const errors: Record<string, string> = {};
    if (!passwordData.oldPassword) {
      errors.oldPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.newPassword)) {
      errors.newPassword = 'Password must contain uppercase, lowercase, and number';
    }
    if (!passwordData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const res = await fetch(`${API_BASE_URL}/auth/change-password/`, {
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
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
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
                  <SettingsIcon className="h-5 w-5" />
                  Platform Configuration
                </CardTitle>
                <CardDescription>
                  Basic platform settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" defaultValue="APISentry Security" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time</SelectItem>
                      <SelectItem value="pst">Pacific Time</SelectItem>
                      <SelectItem value="cet">Central European Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Default Language</Label>
                  <Select defaultValue="en">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  API Configuration
                </CardTitle>
                <CardDescription>
                  Global API settings and rate limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input id="baseUrl" defaultValue="https://api.company.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="globalRateLimit">Global Rate Limit (per minute)</Label>
                  <Input id="globalRateLimit" type="number" defaultValue="1000" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxPayloadSize">Max Payload Size (MB)</Label>
                  <Input id="maxPayloadSize" type="number" defaultValue="10" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Settings - Password Reset */}
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
