import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Code,
  Play,
  Shield,
  AlertTriangle,
  CheckCircle,
  Download,
  Upload,
  Zap,
  XCircle,
  FlaskConical,
  Globe,
  Terminal,
} from "lucide-react";
import { apiService } from "@/services/api";
import type { PlaygroundTestRequest } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  success: boolean;
  outcome: 'ALLOWED' | 'BLOCKED' | 'REJECTED' | 'ERROR';
  blockedBy?: 'waf' | 'envoy' | 'wasm' | null;
  blockReason?: string;
  wafRuleTriggered?: string;
  threatDetected?: string;
  statusCode: number;
  responseTimeMs?: number;
  url: string;
  method: string;
  platformName?: string;
  forwardedPort?: number | string;
  responseHeaders?: Record<string, unknown>;
  responseBody?: unknown;
}

interface ExampleRequest {
  name: string;
  method: string;
  endpoint: string;
  body: string;
  description: string;
}

const Playground = () => {
  const [method, setMethod] = useState("POST");
  const [endpoint, setEndpoint] = useState("/api/v1/users");
  const [headers, setHeaders] = useState(`{
  "Content-Type": "application/json",
  "Authorization": "Bearer token"
}`);
  const [requestBody, setRequestBody] = useState(`{
  "username": "admin",
  "password": "' OR 1=1 --",
  "email": "admin@test.com"
}`);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testAttempted, setTestAttempted] = useState(false);
  const [platform, setPlatform] = useState<any | null>(null);
  const [overrideBaseUrl, setOverrideBaseUrl] = useState<string>("");
  const [overridePort, setOverridePort] = useState<string>("");
  const [portFieldTouched, setPortFieldTouched] = useState<boolean>(false);
  const { toast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) return;
    apiService.getPlatformDetails(platformId)
      .then((p) => {
        setPlatform(p);
        if (p?.application_url) setOverrideBaseUrl(p.application_url);
        if (p?.forwarded_port) setOverridePort(String(p.forwarded_port));
      })
      .catch(() => {});
  }, []);

  const buildTargetUrl = (baseUrl?: string, port?: string, path?: string) => {
    if (!baseUrl) return '';
    let url = baseUrl.trim();
    try {
      const u = new URL(url);
      if (port) u.port = port;
      const final = new URL(path || '/', u.origin + u.pathname.replace(/\/$/, '') + '/');
      if (port) final.port = port;
      final.port = '';
      return final.toString().replace(/\/$/, '');
    } catch {
      const cleanBase = url.replace(/\/$/, '');
      const cleanPath = (path || '/').startsWith('/') ? path : `/${path}`;
      const raw = port ? `${cleanBase}:${port}${cleanPath}` : `${cleanBase}${cleanPath}`;
      return raw.replace(/:\d+(?=\/|$)/, '');
    }
  };

  const effectiveBaseUrl = useMemo(() => {
    return (overrideBaseUrl || platform?.application_url || platform?.base_url || '').trim();
  }, [overrideBaseUrl, platform]);

  const effectivePort = useMemo(() => {
    if (portFieldTouched) return overridePort.trim();
    return String(platform?.forwarded_port || '').trim();
  }, [overridePort, platform, portFieldTouched]);

  const fullTargetUrl = useMemo(() => {
    return buildTargetUrl(effectiveBaseUrl, effectivePort || undefined, endpoint);
  }, [effectiveBaseUrl, effectivePort, endpoint]);

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.method) setMethod(parsed.method);
        if (parsed.endpoint) setEndpoint(parsed.endpoint);
        if (parsed.headers) setHeaders(
          typeof parsed.headers === "string"
            ? parsed.headers
            : JSON.stringify(parsed.headers, null, 2)
        );
        if (parsed.body) setRequestBody(
          typeof parsed.body === "string"
            ? parsed.body
            : JSON.stringify(parsed.body, null, 2)
        );
        toast({
          title: "Import successful",
          description: `Loaded configuration from ${file.name}`,
        });
      } catch {
        toast({
          title: "Import failed",
          description: "File must be valid JSON",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const runTest = async () => {
    setIsLoading(true);
    setTestAttempted(true);
    try {
      const platformId = localStorage.getItem('selected_platform_id');
      if (!platformId) {
        toast({ title: "No platform selected", description: "Please select a platform first", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      let parsedHeaders = {};
      try {
        if (headers.trim()) parsedHeaders = JSON.parse(headers);
      } catch (e) {
        toast({ title: "Invalid headers", description: "Headers must be valid JSON", variant: "destructive" });
        setIsLoading(false);
        return;
      }

      const testData: PlaygroundTestRequest = {
        platform_id: platformId,
        endpoint_path: endpoint,
        method: method.toUpperCase(),
        headers: parsedHeaders,
        body: requestBody.trim() || undefined,
        query_params: {}
      };

      const result = await apiService.testPlaygroundRequest(testData);

      if (result?.success) {
        const status = Number(result.response?.status_code ?? 0);
        let outcome: 'ALLOWED' | 'BLOCKED' | 'REJECTED';
        if (result.blocked) outcome = 'BLOCKED';
        else if (status > 0 && status < 400) outcome = 'ALLOWED';
        else outcome = 'REJECTED';

        setTestResult({
          success: true,
          outcome,
          blockedBy: result.blocked_by,
          blockReason: result.block_reason,
          wafRuleTriggered: result.waf_rule_triggered,
          threatDetected: result.threat_detected,
          statusCode: status,
          responseTimeMs: result.response?.response_time_ms,
          url: result.request?.url || fullTargetUrl || '',
          method: result.request?.method || method,
          platformName: result.platform?.name,
          forwardedPort: result.platform?.forwarded_port,
          responseHeaders: result.response?.headers || {},
          responseBody: result.response?.body
        });
      } else {
        setTestResult({
          success: false,
          outcome: 'ERROR',
          statusCode: 500,
          method: method.toUpperCase(),
          platformName: platform?.name || 'Unknown',
          blockedBy: null,
          blockReason: result.message || 'Unknown error',
          wafRuleTriggered: null,
          threatDetected: null,
          forwardedPort: result.platform?.forwarded_port,
          responseHeaders: result.response?.headers || {},
          responseBody: result.response?.body || result.message || 'No response body',
          url: fullTargetUrl
        });
      }
    } catch (error: any) {
      setTestResult({
        success: false,
        outcome: 'ERROR',
        statusCode: 500,
        method: method.toUpperCase(),
        platformName: platform?.name || 'Unknown',
        blockedBy: null,
        blockReason: error.message || 'Network or parsing error occurred',
        wafRuleTriggered: null,
        threatDetected: null,
        forwardedPort: platform?.forwarded_port,
        responseHeaders: {},
        responseBody: error.message || 'No response body',
        url: fullTargetUrl
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exampleRequests: ExampleRequest[] = [
    { name: "SQL Injection Attack", method: "POST", endpoint: "/api/login", body: `{\n  "username": "admin",\n  "password": "' OR 1=1 --"\n}`, description: "Test SQL injection detection" },
    { name: "XSS Attempt", method: "POST", endpoint: "/api/comments", body: `{\n  "comment": "<script>alert('XSS')</script>",\n  "userId": 123\n}`, description: "Test cross-site scripting detection" },
    { name: "Path Traversal", method: "GET", endpoint: "/api/files/../../etc/passwd", body: "", description: "Test directory traversal detection" },
    { name: "Large Payload", method: "POST", endpoint: "/api/upload", body: `{\n  "data": "${"A".repeat(10000)}"\n}`, description: "Test payload size limits" },
  ];

  const loadExample = (example: ExampleRequest) => {
    setMethod(example.method);
    setEndpoint(example.endpoint);
    setRequestBody(example.body);
    setTestResult(null);
  };

  const getMethodColor = (m: string) => {
    const colors: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      POST: "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
      PUT: "bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400",
      DELETE: "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400",
      PATCH: "bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400",
    };
    return colors[m] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-8 w-full min-w-0 max-w-full">

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImport}
      />

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 sm:px-8 pt-7 pb-6 shadow-lg min-h-[140px]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
        <div className="relative z-10 flex flex-col justify-between h-full gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
              WAF Testing
            </Badge>
            {platform?.name && (
              <Badge className="border-white/20 bg-white/10 px-3 py-1 text-white hover:bg-white/10 text-xs font-medium rounded-full">
                {platform.name}
              </Badge>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white leading-tight break-words">
                Developer Playground
              </h1>
              <p className="mt-1 text-sm text-blue-100 break-words max-w-xl">
                Test your WAF rules and security policies against real attack patterns in real-time.
              </p>
            </div>
            <div className="flex flex-row gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white rounded-full px-4 text-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">

        {/* ── Left column: Request Config + Results ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Request Configuration */}
          <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                <div className="rounded-xl bg-blue-50 p-2 dark:bg-blue-500/10">
                  <Code className="h-4 w-4 text-blue-500" />
                </div>
                Request Configuration
              </CardTitle>
              <CardDescription>Configure your API request to test against WAF rules</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">HTTP Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["GET","POST","PUT","DELETE","PATCH"].map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endpoint" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Endpoint Path</Label>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/v1/resource"
                    className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json"}'
                  className="font-mono rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 text-xs"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body" className="text-xs font-semibold text-slate-600 dark:text-slate-400">Request Body</Label>
                <Textarea
                  id="body"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Enter your request body here..."
                  className="font-mono rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 text-xs"
                  rows={8}
                />
              </div>

              <Button
                onClick={runTest}
                disabled={isLoading}
                className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 font-semibold"
              >
                {isLoading ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Running Test...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Security Test
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Loading State */}
          {isLoading && (
            <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <div className="relative mb-4 h-14 w-14">
                    <div className="absolute inset-0 rounded-full bg-blue-100 dark:bg-blue-500/20 animate-pulse" />
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
                  </div>
                  <p className="font-medium text-slate-700 dark:text-slate-300">Running security analysis...</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Processing request through WAF rules</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          {testAttempted && !isLoading && (
            <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md overflow-hidden">
              <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white">
                  <div className="rounded-xl bg-blue-50 p-2 dark:bg-blue-500/10">
                    <Shield className="h-4 w-4 text-blue-500" />
                  </div>
                  Security Scan Response
                  {testResult && (
                    <Badge
                      className={
                        testResult.outcome === 'BLOCKED'
                          ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 ml-2"
                          : testResult.outcome === 'ALLOWED'
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 ml-2"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 ml-2"
                      }
                    >
                      {testResult.outcome}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Response analysis and security assessment</CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-6">
                {testResult ? (
                  <>
                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { label: "Status Code", value: testResult.statusCode, mono: true },
                        { label: "Response Time", value: typeof testResult.responseTimeMs === 'number' ? `${testResult.responseTimeMs} ms` : '—', mono: false },
                        { label: "Method", value: testResult.method, mono: true },
                        { label: "Platform", value: testResult.platformName || platform?.name || '—', mono: false },
                      ].map(({ label, value, mono }) => (
                        <div key={label} className="rounded-xl border border-slate-200/50 bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-800/30 p-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{label}</p>
                          <p className={`text-sm font-semibold text-slate-900 dark:text-white ${mono ? "font-mono" : ""}`}>{value}</p>
                        </div>
                      ))}

                      {testResult.outcome === 'BLOCKED' && testResult.blockedBy && (
                        <div className="rounded-xl border border-red-200/50 bg-red-50/60 dark:border-red-800/30 dark:bg-red-900/10 p-3">
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Blocked By</p>
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 text-xs">
                            {testResult.blockedBy.toUpperCase()}
                          </Badge>
                        </div>
                      )}

                      <div className="col-span-2 rounded-xl border border-slate-200/50 bg-slate-50/80 dark:border-slate-700/50 dark:bg-slate-800/30 p-3">
                        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Request URL</p>
                        <p className="font-mono text-xs text-slate-900 dark:text-white break-all">
                          {testResult.url || fullTargetUrl || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Block Details */}
                    {testResult.outcome === 'BLOCKED' && (
                      <div className="rounded-xl border border-red-200/50 bg-red-50/60 dark:border-red-800/30 dark:bg-red-900/10 p-4 space-y-2">
                        <p className="text-sm font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                          <XCircle className="h-4 w-4" /> Block Details
                        </p>
                        {testResult.blockReason && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Reason</span>
                            <span className="font-medium text-slate-900 dark:text-white">{testResult.blockReason}</span>
                          </div>
                        )}
                        {testResult.wafRuleTriggered && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">WAF Rule</span>
                            <span className="font-mono text-slate-900 dark:text-white">{testResult.wafRuleTriggered}</span>
                          </div>
                        )}
                        {testResult.threatDetected && (
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">Threat Type</span>
                            <span className="font-medium text-slate-900 dark:text-white">{testResult.threatDetected}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Response Headers */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Response Headers</p>
                      <div className="rounded-xl border border-slate-200/50 bg-slate-950/5 dark:bg-slate-950/50 dark:border-slate-700/50 p-3 font-mono text-xs overflow-x-auto max-h-40 text-slate-700 dark:text-slate-300">
                        {testResult.responseHeaders && Object.keys(testResult.responseHeaders).length > 0
                          ? JSON.stringify(testResult.responseHeaders, null, 2)
                          : '—'}
                      </div>
                    </div>

                    {/* Response Body */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Response Body</p>
                      <div className="rounded-xl border border-slate-200/50 bg-slate-950/5 dark:bg-slate-950/50 dark:border-slate-700/50 p-3 font-mono text-xs overflow-x-auto max-h-40 text-slate-700 dark:text-slate-300">
                        {typeof testResult.responseBody !== 'undefined'
                          ? (typeof testResult.responseBody === 'string'
                              ? testResult.responseBody
                              : JSON.stringify(testResult.responseBody, null, 2))
                          : '—'}
                      </div>
                    </div>

                    {/* Security Analysis */}
                    <div className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-orange-50 p-2 dark:bg-orange-500/10">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        </div>
                        <p className="text-base font-semibold text-slate-900 dark:text-white">Security Analysis</p>
                      </div>

                      {testResult.outcome === 'ERROR' ? (
                        <div className="rounded-xl border border-red-200/50 bg-red-50/60 dark:border-red-800/30 dark:bg-red-900/10 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <XCircle className="h-5 w-5 text-red-500" />
                            <span className="font-semibold text-red-700 dark:text-red-300">Request Failed</span>
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                            {testResult.blockReason || 'The request failed to complete successfully.'}
                          </p>
                          <p className="text-xs text-red-500 dark:text-red-400">Status Code: {testResult.statusCode}</p>
                        </div>
                      ) : testResult.statusCode !== 403 ? (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-red-200/50 bg-red-50/60 dark:border-red-800/30 dark:bg-red-900/10 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <XCircle className="h-5 w-5 text-red-500" />
                              <span className="font-semibold text-red-700 dark:text-red-300">Attack Successful — Test Failed</span>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400">
                              The request was not blocked by the security system, indicating a potential vulnerability.
                            </p>
                          </div>
                          <div className="rounded-xl border border-yellow-200/50 bg-yellow-50/60 dark:border-yellow-800/30 dark:bg-yellow-900/10 p-4">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
                              <div className="text-sm">
                                <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Important Disclaimer</p>
                                <ul className="space-y-1 text-yellow-700 dark:text-yellow-300 text-xs">
                                  <li>• If the request payload is not malicious, the request would be allowed and you shouldn't consider it a failed test</li>
                                  <li>• If it is a malicious attack, it means the application is vulnerable to this attack</li>
                                  <li>• Review the payload carefully to determine if this represents a real security risk</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20 text-sm"
                              onClick={() => toast({ title: "Request Submitted", description: "Your request has been submitted to the admin for WAF rule inclusion", variant: "default" })}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Submit to Admin
                            </Button>
                            <Button
                              variant="outline"
                              className="rounded-xl border-slate-200/70 dark:border-slate-700 text-sm"
                              onClick={() => toast({ title: "Marked as False Positive", description: "This test has been marked as a false positive", variant: "default" })}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Mark as False Positive
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-green-200/50 bg-green-50/60 dark:border-green-800/30 dark:bg-green-900/10 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-semibold text-green-700 dark:text-green-300">Attack Blocked — Test Passed</span>
                          </div>
                          <p className="text-sm text-green-600 dark:text-green-400">
                            The request was successfully blocked by the security system, indicating proper protection.
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
                      <AlertTriangle className="h-8 w-8 text-red-400" />
                    </div>
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Test Failed</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      Unable to process the security test request. Check your configuration and try again.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-6">

          {/* Testing Scope */}
          <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
                <div className="rounded-xl bg-cyan-50 p-2 dark:bg-cyan-500/10">
                  <Globe className="h-4 w-4 text-cyan-500" />
                </div>
                Testing Scope
              </CardTitle>
              <CardDescription>Context for the current test execution</CardDescription>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Platform</Label>
                <p className="text-sm text-slate-700 dark:text-slate-300">{platform?.name || '—'}</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Application URL</Label>
                <Input
                  placeholder="https://api.example.com"
                  value={effectiveBaseUrl}
                  onChange={(e) => setOverrideBaseUrl(e.target.value)}
                  className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 text-xs"
                />
                <p className="text-xs text-slate-400 dark:text-slate-500">Prefilled from platform if available</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Forwarded Port</Label>
                <Input
                  placeholder="443"
                  value={portFieldTouched ? overridePort : effectivePort}
                  onChange={(e) => { setPortFieldTouched(true); setOverridePort(e.target.value); }}
                  className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Endpoint Path</Label>
                <Input
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  className="rounded-xl border-slate-200/70 bg-slate-50/80 dark:border-slate-700/70 dark:bg-slate-800/50 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Full Target URL</Label>
                <div className="rounded-xl border border-slate-200/50 bg-slate-950/5 dark:border-slate-700/50 dark:bg-slate-950/50 p-2.5 font-mono text-xs break-all text-slate-700 dark:text-slate-300">
                  {fullTargetUrl || '—'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Attacks */}
          <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
                <div className="rounded-xl bg-orange-50 p-2 dark:bg-orange-500/10">
                  <FlaskConical className="h-4 w-4 text-orange-500" />
                </div>
                Example Attacks
              </CardTitle>
              <CardDescription>Pre-configured patterns to test your WAF</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-2">
              {exampleRequests.map((example, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200/50 bg-slate-50/60 p-3 hover:bg-blue-50/40 dark:border-slate-700/50 dark:bg-slate-800/30 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  onClick={() => loadExample(example)}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{example.name}</p>
                    <Badge className={`${getMethodColor(example.method)} text-xs`}>{example.method}</Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{example.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Testing Tips */}
          <Card className="rounded-2xl border border-slate-200/50 bg-white dark:border-slate-800/50 dark:bg-slate-900/50 shadow-md">
            <CardHeader className="border-b border-slate-200/50 bg-gradient-to-r from-slate-50 to-transparent dark:border-slate-800/50 dark:from-slate-800/30">
              <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-white text-base">
                <div className="rounded-xl bg-violet-50 p-2 dark:bg-violet-500/10">
                  <Terminal className="h-4 w-4 text-violet-500" />
                </div>
                Testing Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {[
                "Test different HTTP methods and endpoints for comprehensive coverage",
                "Include various payload sizes to test rate limiting and size restrictions",
                "Validate both legitimate and malicious requests to check for false positives",
                "Use the confidence score to fine-tune your detection rules",
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{tip}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Playground;