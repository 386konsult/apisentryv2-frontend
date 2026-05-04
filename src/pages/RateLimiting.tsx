import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiService } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Gauge, AlertCircle, Shield, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RateLimitRule {
  id: string;
  endpoint: string;
  method: string | null;
  max_requests: number;
  time_window_seconds: number;
  action: "block" | "throttle" | "alert";
  is_active: boolean;
}

export default function RateLimiting() {
  const { id: platformId } = useParams();
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RateLimitRule | null>(null);
  const [form, setForm] = useState({
    endpoint: "*",
    method: "*",
    max_requests: 100,
    time_window_seconds: 60,
    action: "block" as const,
    is_active: true,
  });
  const { toast } = useToast();

  const loadRules = async () => {
    if (!platformId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.request(`/rate-limits/?platform_id=${platformId}`);
      setRules(data.results || data);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || "Failed to load rate limits";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, [platformId]);

  const handleSave = async () => {
  try {
    // Normalise endpoint: empty or whitespace becomes "*"
    const endpointValue = form.endpoint.trim() === "" ? "*" : form.endpoint;
    const payload = { ...form, endpoint: endpointValue, platform: platformId };

    if (editingRule) {
      await apiService.request(`/rate-limits/${editingRule.id}/`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      toast({ title: "Rule updated", description: "Rate limit rule has been updated." });
    } else {
      await apiService.request("/rate-limits/", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      toast({ title: "Rule created", description: "New rate limit rule added." });
    }
    setDialogOpen(false);
    setEditingRule(null);
    loadRules();
  } catch (error: any) {
    toast({
      title: "Error",
      description: error?.message || "Failed to save rule",
      variant: "destructive",
    });
  }
};

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    try {
      await apiService.request(`/rate-limits/${id}/`, { method: "DELETE" });
      toast({ title: "Rule deleted", description: "Rate limit rule removed." });
      loadRules();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const openCreate = () => {
    setEditingRule(null);
    setForm({
      endpoint: "*",
      method: "*",
      max_requests: 100,
      time_window_seconds: 60,
      action: "block",
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (rule: RateLimitRule) => {
    setEditingRule(rule);
    setForm({
      endpoint: rule.endpoint,
      method: rule.method || "*",
      max_requests: rule.max_requests,
      time_window_seconds: rule.time_window_seconds,
      action: rule.action,
      is_active: rule.is_active,
    });
    setDialogOpen(true);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "block":
        return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Block</Badge>;
      case "throttle":
        return <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Throttle</Badge>;
      case "alert":
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Alert</Badge>;
      default:
        return <Badge>{action}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-3 text-sm text-slate-500">Loading rate limit rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F4F8FF] dark:bg-[#0F1724] px-6 pb-10 pt-6">
      <div className="w-full space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-[24px] bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-8 text-white shadow-lg"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge className="border-white/20 bg-white/15 text-white">Rate Limiting</Badge>
                <Badge className="border-white/20 bg-white/15 text-white">Traffic Controls</Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Rate Limiting</h1>
              <p className="text-sm text-blue-100 mt-1">Define request limits per endpoint to protect your API from abuse</p>
            </div>
            <Button onClick={openCreate} className="rounded-full bg-white px-5 py-2 text-blue-600 font-medium hover:bg-white/90 shadow-md">
              <Plus className="mr-2 h-4 w-4" /> Add Rule
            </Button>
          </div>
        </motion.div>

        {/* Error State – with helpful message */}
        {error && (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="p-6 flex items-start gap-3">
              <Server className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-300">Backend API unreachable</p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  The rate‑limits endpoint returned a {error.includes("404") ? "404 Not Found" : "server error"}.
                  Make sure the backend is running and the router is correctly registered.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-mono">
                  Expected URL: <code className="bg-amber-100 dark:bg-amber-900/30 px-1 rounded">/api/v1/rate-limits/?platform_id=...</code>
                </p>
                <Button variant="outline" onClick={loadRules} className="mt-3 border-amber-300 bg-white/50 text-amber-800 hover:bg-amber-100">
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Card */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/70 shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="border-b border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900">
            <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
              <Gauge className="h-5 w-5 text-blue-500" />
              Rate Limit Rules
            </CardTitle>
            <CardDescription>Rules are evaluated in order – the first matching rule applies.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {!error && rules.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                  <Shield className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No active rate limits</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Your API is currently unprotected against excessive requests. Add a rule to limit request rates per endpoint.
                </p>
                <Button onClick={openCreate} className="mt-6">
                  <Plus className="mr-2 h-4 w-4" /> Create your first rule
                </Button>
              </div>
            )}
            {!error && rules.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Max Requests</TableHead>
                      <TableHead>Time Window (s)</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Active</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-mono text-sm">{rule.endpoint}</TableCell>
                        <TableCell>{rule.method || "*"}</TableCell>
                        <TableCell>{rule.max_requests}</TableCell>
                        <TableCell>{rule.time_window_seconds}</TableCell>
                        <TableCell>{getActionBadge(rule.action)}</TableCell>
                        <TableCell>
                          {rule.is_active ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-slate-500">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingRule ? "Edit Rate Limit Rule" : "Create Rate Limit Rule"}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Endpoint</Label>
                <Input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} className="col-span-3" placeholder="/api/users/*" />
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Method</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v })}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="*">All Methods</SelectItem>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Max Requests</Label><Input type="number" value={form.max_requests} onChange={(e) => setForm({ ...form, max_requests: parseInt(e.target.value) })} /></div>
                <div><Label>Time Window (sec)</Label><Input type="number" value={form.time_window_seconds} onChange={(e) => setForm({ ...form, time_window_seconds: parseInt(e.target.value) })} /></div>
              </div>
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Action</Label>
                <Select value={form.action} onValueChange={(v: any) => setForm({ ...form, action: v })}>
                  <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block (return 403)</SelectItem>
                    <SelectItem value="throttle">Throttle (delay)</SelectItem>
                    <SelectItem value="alert">Alert only (no block)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(c) => setForm({ ...form, is_active: c })} />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave}>Save Rule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}