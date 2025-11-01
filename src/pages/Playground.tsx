import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Code,
  Play,
  Shield,
  AlertTriangle,
  CheckCircle,
  Copy,
  Download,
  Upload,
  Zap,
  XCircle,
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

  useEffect(() => {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) return;
    apiService.getPlatformDetails(platformId)
      .then((p) => {
        setPlatform(p);
        // Pre-fill overrides from platform details if present
        if (p?.application_url) setOverrideBaseUrl(p.application_url);
        if (p?.forwarded_port) setOverridePort(String(p.forwarded_port));
      })
      .catch(() => {
        // no-op
      });
  }, []);

  const buildTargetUrl = (baseUrl?: string, port?: string, path?: string) => {
    if (!baseUrl) return '';
    let url = baseUrl.trim();
    try {
      const u = new URL(url);
      // Always force forwarded port if provided (override any port found in base URL)
      if (port) {
        u.port = port;
      }
      // Append endpoint path safely
      const final = new URL(path || '/', u.origin + u.pathname.replace(/\/$/, '') + '/');
      // Ensure forced port persists during construction
      if (port) final.port = port;
      // REMOVE port from returned string (display-only)
      final.port = '';
      return final.toString().replace(/\/$/, '');
    } catch {
      // Fallback simple concat
      const cleanBase = url.replace(/\/$/, '');
      const cleanPath = (path || '/').startsWith('/') ? path : `/${path}`;
      // Build string (may include :port) then strip any ":<digits>" after host for display
      const raw = port ? `${cleanBase}:${port}${cleanPath}` : `${cleanBase}${cleanPath}`;
      return raw.replace(/:\d+(?=\/|$)/, '');
    }
  };

  const effectiveBaseUrl = useMemo(() => {
    return (overrideBaseUrl || platform?.application_url || platform?.base_url || '').trim();
  }, [overrideBaseUrl, platform]);

  const effectivePort = useMemo(() => {
    // If user has touched the port field, use their value (including empty)
    // Otherwise, use the platform's forwarded_port
    if (portFieldTouched) {
      return overridePort.trim();
    }
    return String(platform?.forwarded_port || '').trim();
  }, [overridePort, platform, portFieldTouched]);

  const fullTargetUrl = useMemo(() => {
    return buildTargetUrl(effectiveBaseUrl, effectivePort || undefined, endpoint);
  }, [effectiveBaseUrl, effectivePort, endpoint]);

  const runTest = async () => {
    setIsLoading(true);
    setTestAttempted(true);
    try {
      const platformId = localStorage.getItem('selected_platform_id');
      if (!platformId) {
        toast({
          title: "No platform selected",
          description: "Please select a platform first",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Parse headers
      let parsedHeaders = {};
      try {
        if (headers.trim()) {
          parsedHeaders = JSON.parse(headers);
        }
      } catch (e) {
        toast({
          title: "Invalid headers",
          description: "Headers must be valid JSON",
          variant: "destructive",
        });
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
        
        // Determine outcome based on blocking status
        let outcome: 'ALLOWED' | 'BLOCKED' | 'REJECTED';
        if (result.blocked) {
          outcome = 'BLOCKED';
        } else if (status > 0 && status < 400) {
          outcome = 'ALLOWED';
        } else {
          outcome = 'REJECTED';
        }

        const normalized: TestResult = {
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
        };

        setTestResult(normalized);
      } else {
        // Backend returned success: false or unexpected - create error result
        const errorResult: TestResult = {
          success: false,
          outcome: 'ERROR',
          statusCode: 500, // Default error status
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
        };
        setTestResult(errorResult);
      }
    } catch (error: any) {
      console.error('Test error:', error);
      // Create error result for network/parsing errors
      const errorResult: TestResult = {
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
      };
      setTestResult(errorResult);
    } finally {
      setIsLoading(false);
    }
  };

  const exampleRequests = [
    {
      name: "SQL Injection Attack",
      method: "POST",
      endpoint: "/api/login",
      body: `{
  "username": "admin",
  "password": "' OR 1=1 --"
}`,
      description: "Test SQL injection detection"
    },
    {
      name: "XSS Attempt",
      method: "POST",
      endpoint: "/api/comments",
      body: `{
  "comment": "<script>alert('XSS')</script>",
  "userId": 123
}`,
      description: "Test cross-site scripting detection"
    },
    {
      name: "Path Traversal",
      method: "GET",
      endpoint: "/api/files/../../etc/passwd",
      body: "",
      description: "Test directory traversal detection"
    },
    {
      name: "Large Payload",
      method: "POST",
      endpoint: "/api/upload",
      body: `{
  "data": "${"A".repeat(10000)}"
}`,
      description: "Test payload size limits"
    }
  ];

  const loadExample = (example: ExampleRequest) => {
    setMethod(example.method);
    setEndpoint(example.endpoint);
    setRequestBody(example.body);
    setTestResult(null);
  };

  return (
    <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Developer Playground{platform && <span className="text-lg font-normal text-muted-foreground ml-2"> • {platform.name}</span>}</h1>
                <p className="text-muted-foreground">
                  Test your WAF rules and security policies in real-time
                </p>
              </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Test
          </Button>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import Test
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Request Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Request Configuration
              </CardTitle>
              <CardDescription>
                Configure your API request to test against WAF rules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="method">HTTP Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endpoint">Endpoint</Label>
                  <Input
                    id="endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    placeholder="/api/v1/resource"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headers">Headers (JSON)</Label>
                <Textarea
                  id="headers"
                  value={headers}
                  onChange={(e) => setHeaders(e.target.value)}
                  placeholder='{"Content-Type": "application/json", "Authorization": "Bearer token"}'
                  className="font-mono"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Request Body</Label>
                <Textarea
                  id="body"
                  value={requestBody}
                  onChange={(e) => setRequestBody(e.target.value)}
                  placeholder="Enter your request body here..."
                  className="font-mono"
                  rows={8}
                />
              </div>

              <Button 
                onClick={runTest} 
                disabled={isLoading}
                className="w-full gradient-primary"
              >
                {isLoading ? (
                  <>
                    <Zap className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
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
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Security Scan Response
                </CardTitle>
                <CardDescription>
                  Running security test...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="text-muted-foreground">Processing security test request...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Test Results */}
          {testAttempted && !isLoading && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  Security Scan Response
                </CardTitle>
                <CardDescription>
                  Response analysis and security assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {testResult ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Outcome</Label>
                        <Badge
                          variant={testResult.outcome === 'ALLOWED' ? 'default' : 'destructive'}
                          className="w-fit"
                        >
                          {testResult.outcome === 'ERROR' ? 'ERROR' : testResult.outcome}
                        </Badge>
                  </div>

                  {testResult.outcome === 'BLOCKED' && testResult.blockedBy && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Blocked By</Label>
                      <Badge variant="destructive" className="w-fit">
                        {testResult.blockedBy.toUpperCase()}
                      </Badge>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status Code</Label>
                    <div className="text-sm font-medium">{testResult.statusCode}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Response Time</Label>
                    <div className="text-sm font-medium">
                      {typeof testResult.responseTimeMs === 'number' ? `${testResult.responseTimeMs} ms` : '—'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Method</Label>
                    <div className="text-sm font-medium">{testResult.method}</div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Platform</Label>
                    <div className="text-sm text-muted-foreground">
                      {testResult.platformName || platform?.name || '—'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Forwarded Port</Label>
                    <div className="text-sm text-muted-foreground">
                      {(testResult.forwardedPort ?? effectivePort) ?? '—'}
                    </div>
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs text-muted-foreground">Request URL</Label>
                    <div className="bg-muted p-2 rounded font-mono text-xs break-all">
                      {testResult.url || fullTargetUrl || '—'}
                    </div>
                  </div>
                </div>

                {/* Block Details */}
                {testResult.outcome === 'BLOCKED' && (
                  <div className="space-y-2 border-t pt-4">
                    <Label className="text-sm font-medium text-red-600">Block Details</Label>
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg space-y-2">
                      {testResult.blockReason && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Reason:</span>
                          <span className="text-sm font-medium">{testResult.blockReason}</span>
                        </div>
                      )}
                      {testResult.wafRuleTriggered && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">WAF Rule:</span>
                          <span className="text-sm font-mono">{testResult.wafRuleTriggered}</span>
                        </div>
                      )}
                      {testResult.threatDetected && (
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Threat Type:</span>
                          <span className="text-sm font-medium">{testResult.threatDetected}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Response Headers</Label>
                  <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                    {testResult.responseHeaders && Object.keys(testResult.responseHeaders).length > 0
                      ? JSON.stringify(testResult.responseHeaders, null, 2)
                      : '—'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Response Body</Label>
                  <div className="bg-muted p-3 rounded font-mono text-xs overflow-x-auto">
                    {typeof testResult.responseBody !== 'undefined'
                      ? (typeof testResult.responseBody === 'string'
                          ? testResult.responseBody
                          : JSON.stringify(testResult.responseBody, null, 2))
                      : '—'}
                  </div>
                </div>

                {/* Security Analysis */}
                <div className="space-y-4 border-t pt-6">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    <Label className="text-lg font-semibold">Security Analysis</Label>
                  </div>
                  
                  {testResult.outcome === 'ERROR' ? (
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="font-semibold text-red-700 dark:text-red-300">Request Failed</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                          {testResult.blockReason || 'The request failed to complete successfully.'}
                        </p>
                        <div className="text-xs text-red-500 dark:text-red-400">
                          Status Code: {testResult.statusCode}
                        </div>
                      </div>
                    </div>
                  ) : testResult.statusCode !== 403 ? (
                    <div className="space-y-4">
                      <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="h-5 w-5 text-red-500" />
                          <span className="font-semibold text-red-700 dark:text-red-300">Attack Successful - Test Failed</span>
                        </div>
                        <p className="text-sm text-red-600 dark:text-red-400">
                          The request was not blocked by the security system, indicating a potential vulnerability.
                        </p>
                      </div>
                      
                      <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Important Disclaimer:</p>
                            <ul className="space-y-1 text-yellow-700 dark:text-yellow-300">
                              <li>• If the request payload is not malicious, the request would be allowed and you shouldn't consider it a failed test</li>
                              <li>• If it is a malicious attack, it means the application is vulnerable to this attack</li>
                              <li>• Review the payload carefully to determine if this represents a real security risk</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          className="gradient-primary"
                          onClick={() => {
                            // TODO: Implement submit to admin functionality
                            toast({
                              title: "Request Submitted",
                              description: "Your request has been submitted to the admin for WAF rule inclusion",
                              variant: "default",
                            });
                          }}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Submit Request to Admin
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => {
                            // TODO: Implement mark as false positive functionality
                            toast({
                              title: "Marked as False Positive",
                              description: "This test has been marked as a false positive",
                              variant: "default",
                            });
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Mark as False Positive
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <span className="font-semibold text-green-700 dark:text-green-300">Attack Blocked - Test Passed</span>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        The request was successfully blocked by the security system, indicating proper protection.
                      </p>
                    </div>
                  )}
                </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-600 mb-2">Test Failed</h3>
                    <p className="text-muted-foreground">
                      Unable to process the security test request. Please check your configuration and try again.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar: Testing Scope + Example Requests */}
        <div className="space-y-6">
          {/* Testing Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Testing Scope
              </CardTitle>
              <CardDescription>Context for the current test execution</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Platform</Label>
                <div className="text-sm text-muted-foreground">
                  {platform?.name || '—'}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Application URL</Label>
                <Input
                  placeholder="https://api.example.com"
                  value={effectiveBaseUrl}
                  onChange={(e) => setOverrideBaseUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Prefilled from platform details if available
                </p>
              </div>

              <div className="space-y-2">
                <Label>Forwarded Port</Label>
                <Input
                  placeholder="443"
                  value={portFieldTouched ? overridePort : effectivePort}
                  onChange={(e) => {
                    setPortFieldTouched(true);
                    setOverridePort(e.target.value);
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Optional. If set and missing in base URL, it will be applied
                </p>
              </div>

              <div className="space-y-2">
                <Label>Endpoint Path</Label>
                <Input value={endpoint} onChange={(e) => setEndpoint(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Full Target URL</Label>
                <div className="bg-muted p-3 rounded font-mono text-xs break-all">
                  {fullTargetUrl || '—'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Example Attacks
              </CardTitle>
              <CardDescription>
                Pre-configured attack patterns to test your WAF
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exampleRequests.map((example, index) => (
                  <div
                    key={index}
                    className="border border-border/50 rounded-lg p-3 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => loadExample(example)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{example.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {example.method}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {example.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Testing Tips */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Testing Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <p>Test different HTTP methods and endpoints to ensure comprehensive coverage</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <p>Include various payload sizes to test rate limiting and size restrictions</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <p>Validate both legitimate and malicious requests to check for false positives</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                  <p>Use the confidence score to fine-tune your detection rules</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Playground;
