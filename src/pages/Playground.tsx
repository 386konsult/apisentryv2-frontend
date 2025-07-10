
import { useState } from "react";
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
} from "lucide-react";

const Playground = () => {
  const [method, setMethod] = useState("POST");
  const [endpoint, setEndpoint] = useState("/api/v1/users");
  const [requestBody, setRequestBody] = useState(`{
  "username": "admin",
  "password": "' OR 1=1 --",
  "email": "admin@test.com"
}`);
  const [testResult, setTestResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async () => {
    setIsLoading(true);
    
    // Simulate API test with mock results
    setTimeout(() => {
      const mockResult = {
        detected: true,
        threatType: "SQL Injection",
        severity: "high",
        ruleTriggered: "RULE001 - SQL Injection Pattern",
        action: "BLOCKED",
        confidence: 95,
        explanation: "Detected SQL injection attempt in the password field. Pattern '1=1 --' matches known SQL injection signatures.",
        details: {
          field: "password",
          pattern: "' OR 1=1 --",
          rule: "OWASP_CRS_942_APPLICATION_ATTACK_SQLI",
          matchedRegex: "(\\b(?:(?:s(?:elect\\b(?:\\s+(?:(?:distinct|all)\\s+)?(?:.*?\\bfrom\\b|\\*|\\w+))|p_(?:addextendedprop|sqlexec)|ql_(?:longvarchar|variant))|.*?\\b(?:having|where)\\b.*?\\bin\\b\\s*\\(|.*?\\bor\\b\\s+.*?[=\\w].*?[=\\w]|.*?\\b(?:and|or)\\b\\s+.*?\\b(?:select|insert|delete|update|drop|create|exec)\\b))"
        }
      };
      
      setTestResult(mockResult);
      setIsLoading(false);
    }, 2000);
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

  const loadExample = (example: any) => {
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
          <h1 className="text-3xl font-bold tracking-tight">Developer Playground</h1>
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

          {/* Test Results */}
          {testResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {testResult.detected ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  Test Results
                </CardTitle>
                <CardDescription>
                  WAF engine analysis and detection results
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Badge 
                      variant={testResult.detected ? "destructive" : "default"}
                      className="w-fit"
                    >
                      {testResult.detected ? "THREAT DETECTED" : "CLEAN"}
                    </Badge>
                  </div>
                  
                  {testResult.detected && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Threat Type</Label>
                        <div className="text-sm font-medium">{testResult.threatType}</div>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Severity</Label>
                        <Badge variant="destructive">{testResult.severity.toUpperCase()}</Badge>
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Action</Label>
                        <Badge variant="secondary">{testResult.action}</Badge>
                      </div>
                    </>
                  )}
                </div>

                {testResult.detected && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Detection Details</Label>
                      <div className="bg-muted p-4 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Rule Triggered:</span>
                          <span className="text-sm font-mono">{testResult.ruleTriggered}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Confidence:</span>
                          <span className="text-sm font-medium">{testResult.confidence}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Affected Field:</span>
                          <span className="text-sm font-mono">{testResult.details.field}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Explanation</Label>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {testResult.explanation}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Matched Pattern</Label>
                      <div className="bg-muted p-3 rounded font-mono text-sm overflow-x-auto">
                        {testResult.details.pattern}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Example Requests */}
        <div>
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
