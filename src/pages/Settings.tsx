import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings as SettingsIcon,
  Globe,
  Save,
  Eye,
  EyeOff,
  Lock,
  Terminal,
  Cloud,
  Server,
  Copy,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService, API_BASE_URL } from "@/services/api";

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

  const [selectedOS, setSelectedOS] = useState<"linux" | "windows">("linux");
  const [selectedTool, setSelectedTool] = useState<"curl" | "wget">("curl");

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
    <div className="space-y-8 w-full min-w-0 max-w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
          <div className="relative z-10 flex flex-col justify-between h-full gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Platform Settings
              </Badge>
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                Security Controls
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-sm">
                    <SettingsIcon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
                      Settings
                    </h1>
                    <p className="mt-1 text-sm text-blue-100 max-w-xl">
                      Configure your platform preferences and security settings
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="general" className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <TabsList className="flex h-auto w-fit gap-1 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 bg-slate-100/60 dark:bg-slate-800/30 p-1">
            <TabsTrigger
              value="general"
              className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="rounded-xl px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-900 dark:data-[state=active]:text-white"
            >
              Security
            </TabsTrigger>
          </TabsList>
        </motion.div>

        <TabsContent value="general">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid gap-6 md:grid-cols-2"
          >
            <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
              <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 p-2">
                    <Globe className="h-4 w-4 text-blue-500" />
                  </div>
                  Platform Details
                </CardTitle>
                <CardDescription>
                  View and update your platform details
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                {platformDetails ? (
                  <form onSubmit={handlePlatformUpdate} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="platformName" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Platform Name
                      </Label>
                      <Input
                        id="platformName"
                        value={platformFormData.name || platformDetails.name}
                        onChange={(e) =>
                          setPlatformFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="applicationUrl" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Base URL
                      </Label>
                      <Input
                        id="applicationUrl"
                        value={platformFormData.application_url}
                        onChange={(e) =>
                          setPlatformFormData((prev) => ({
                            ...prev,
                            application_url: e.target.value,
                          }))
                        }
                        className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="listeningPort" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Listening Port
                        </Label>
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
                          className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="forwardedPort" className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          Forwarded Port
                        </Label>
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
                          className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button
                        type="submit"
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
                        disabled={isUpdatingPlatform}
                      >
                        <Save className={`h-4 w-4 mr-2 ${isUpdatingPlatform ? "animate-spin" : ""}`} />
                        {isUpdatingPlatform ? "Updating..." : "Update Platform"}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-slate-500 dark:text-slate-400">Loading platform details...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
              <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <div className="rounded-xl bg-violet-50 dark:bg-violet-500/10 p-2">
                    <Terminal className="h-4 w-4 text-violet-500" />
                  </div>
                  Installation Commands
                </CardTitle>
                <CardDescription>
                  Use the following commands to install the platform
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                    Select Your Operating System
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Choose your OS and copy the installation command below.
                  </p>
                </div>

                <div className="flex justify-center gap-4 mb-4">
                  <Button
                    variant={selectedOS === "linux" ? "default" : "outline"}
                    onClick={() => {
                      setSelectedOS("linux");
                      setSelectedTool("curl");
                    }}
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Server className="h-5 w-5" />
                    Linux
                  </Button>

                  <Button
                    variant={selectedOS === "windows" ? "default" : "outline"}
                    onClick={() => setSelectedOS("windows")}
                    className="flex items-center gap-2 rounded-xl"
                  >
                    <Cloud className="h-5 w-5" />
                    Windows
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Installation Command ({selectedOS === "linux" ? "Linux" : "Windows"})
                  </Label>

                  <div className="rounded-2xl border border-slate-200/60 bg-slate-950 p-4 text-white dark:border-slate-700/60">
                    <div className="flex items-start gap-3">
                      <code className="text-sm font-mono flex-1 break-all text-slate-100">
                        {platformDetails
                          ? selectedOS === "linux"
                            ? `curl -L https://raw.githubusercontent.com/386konsult/installation-script/main/install.sh -o install.sh && chmod +x install.sh && sudo ./install.sh ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port} ${API_BASE_URL}`
                            : `curl -L https://raw.githubusercontent.com/386konsult/installation-script/main/install.bat -o install.bat && install.bat ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port} ${API_BASE_URL}`
                          : "Loading..."}
                      </code>

                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-xl"
                        onClick={() => {
                          const command = platformDetails
                            ? selectedOS === "linux"
                              ? `curl -L https://raw.githubusercontent.com/386konsult/installation-script/main/install.sh -o install.sh && chmod +x install.sh && sudo ./install.sh ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port} ${API_BASE_URL}`
                              : `curl -L https://raw.githubusercontent.com/386konsult/installation-script/main/install.bat -o install.bat && install.bat ${platformDetails.id} ${platformDetails.listening_port} ${platformDetails.forwarded_port} ${API_BASE_URL}`
                            : "";
                          navigator.clipboard.writeText(command);
                          toast({
                            title: "Copied to Clipboard",
                            description: "The installation command has been copied.",
                            variant: "default",
                          });
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    This command will install Envoy, download the .wasm module, and configure it to listen on the specified ports.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="max-w-2xl rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
              <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <div className="rounded-xl bg-red-50 dark:bg-red-500/10 p-2">
                    <Lock className="h-4 w-4 text-red-500" />
                  </div>
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your account password to keep your account secure
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6">
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">
                      Current Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="oldPassword"
                        type={showOldPassword ? "text" : "password"}
                        placeholder="Enter your current password"
                        value={passwordData.oldPassword}
                        onChange={(e) => {
                          setPasswordData((prev) => ({ ...prev, oldPassword: e.target.value }));
                          if (passwordErrors.oldPassword) {
                            setPasswordErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.oldPassword;
                              return newErrors;
                            });
                          }
                        }}
                        className={`pl-10 pr-10 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 ${passwordErrors.oldPassword ? "border-destructive" : ""}`}
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                        onClick={() => setShowOldPassword(!showOldPassword)}
                      >
                        {showOldPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordErrors.oldPassword && (
                      <p className="text-xs text-destructive">{passwordErrors.oldPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">
                      New Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Enter your new password"
                        value={passwordData.newPassword}
                        onChange={(e) => {
                          setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }));
                          if (passwordErrors.newPassword) {
                            setPasswordErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.newPassword;
                              return newErrors;
                            });
                          }
                        }}
                        className={`pl-10 pr-10 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 ${passwordErrors.newPassword ? "border-destructive" : ""}`}
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>

                    {passwordData.newPassword && (
                      <div className="rounded-xl border border-slate-200/60 bg-slate-50/70 px-4 py-3 dark:border-slate-700/60 dark:bg-slate-800/30">
                        <ul className="text-xs text-muted-foreground space-y-1">
                          <li className={`flex items-center gap-1 ${passwordData.newPassword.length >= 8 ? "text-green-600 dark:text-green-400" : ""}`}>
                            {passwordData.newPassword.length >= 8 ? "✓" : "○"} At least 8 characters
                          </li>
                          <li className={`flex items-center gap-1 ${/(?=.*[a-z])(?=.*[A-Z])/.test(passwordData.newPassword) ? "text-green-600 dark:text-green-400" : ""}`}>
                            {/(?=.*[a-z])(?=.*[A-Z])/.test(passwordData.newPassword) ? "✓" : "○"} Uppercase and lowercase letters
                          </li>
                          <li className={`flex items-center gap-1 ${/\d/.test(passwordData.newPassword) ? "text-green-600 dark:text-green-400" : ""}`}>
                            {/\d/.test(passwordData.newPassword) ? "✓" : "○"} At least one number
                          </li>
                        </ul>
                      </div>
                    )}

                    {passwordErrors.newPassword && (
                      <p className="text-xs text-destructive">{passwordErrors.newPassword}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm your new password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => {
                          setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }));
                          if (passwordErrors.confirmPassword) {
                            setPasswordErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.confirmPassword;
                              return newErrors;
                            });
                          }
                        }}
                        className={`pl-10 pr-10 rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 ${
                          passwordErrors.confirmPassword
                            ? "border-destructive"
                            : passwordData.confirmPassword && passwordData.newPassword === passwordData.confirmPassword
                              ? "border-green-500"
                              : ""
                        }`}
                        required
                        minLength={8}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-lg"
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
                      className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20"
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
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
