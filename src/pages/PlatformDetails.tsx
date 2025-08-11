
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, Shield, AlertTriangle, Globe, Settings, Activity } from 'lucide-react';
import apiService from '@/services/api';

const PlatformDetails = () => {
  const { id } = useParams();
  const [platform, setPlatform] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [endpoints, setEndpoints] = useState([]);
  const [wafRules, setWafRules] = useState([]);
  const [threatLogs, setThreatLogs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    apiService.getPlatformDetails(id)
      .then((data) => {
        setPlatform(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    // Fetch stats
    apiService.getDashboardStats()
      .then(setStats)
      .catch(() => {});
    // Fetch endpoints
    apiService.getPlatformEndpoints(id)
      .then(setEndpoints)
      .catch(() => {});
    // Fetch WAF rules
    apiService.getPlatformWAFRules(id)
      .then(setWafRules)
      .catch(() => {});
    // Fetch threat logs from request-logs endpoint
    apiService.getPlatformRequestLogs(id)
      .then(setThreatLogs)
      .catch(() => {});
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!platform) return <div className="p-8 text-center">Platform not found.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Back to platforms button (red X, bottom right, always visible) */}
      <button
        onClick={() => navigate('/platforms')}
        className="fixed bottom-8 right-8 z-50 p-2 rounded-full bg-red-100 hover:bg-red-200 text-xl text-red-600 hover:text-red-800 transition shadow"
        title="Back to Platforms"
      >
        &#10005;
      </button>
      <div className="w-full max-w-4xl space-y-8">
        {/* Platform Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              {platform.name}
            </CardTitle>
            <CardDescription>
              {platform.deployment_type === 'saas' ? 'SaaS (Managed)' : 'On-Premises'} • {platform.environment}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div><Label>Status:</Label> <Badge>{platform.status}</Badge></div>
            <div><Label>Application URL:</Label> <span>{platform.application_url}</span></div>
            <div><Label>Created At:</Label> <span>{platform.created_at}</span></div>
          </CardContent>
        </Card>

        {/* Platform Stats (from platform object, fallback to stats) */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Stats</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Total Requests</Label>
              <div className="font-bold text-lg">{platform.total_requests ?? stats?.total_requests ?? 0}</div>
            </div>
            <div>
              <Label>Blocked Threats</Label>
              <div className="font-bold text-lg text-red-600">{platform.blocked_threats ?? stats?.blocked_threats ?? 0}</div>
            </div>
            <div>
              <Label>Active Endpoints</Label>
              <div className="font-bold text-lg">{platform.active_endpoints ?? stats?.active_endpoints ?? 0}</div>
            </div>
            <div>
              <Label>Avg Response Time</Label>
              <div className="font-bold text-lg">{stats?.avg_response_time ?? 0} ms</div>
            </div>
          </CardContent>
        </Card>

        {/* Endpoints List */}
        <Card>
          <CardHeader>
            <CardTitle>API Endpoints</CardTitle>
          </CardHeader>
          <CardContent>
            {endpoints.length === 0 ? (
              <div className="text-muted-foreground">No endpoints found.</div>
            ) : (
              <ul className="space-y-2">
                {endpoints.map((ep: any) => (
                  <li key={ep.id} className="border-b pb-2">
                    <span className="font-semibold">{ep.name}</span> <span className="text-xs">({ep.method} {ep.path})</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* WAF Rules List */}
        <Card>
          <CardHeader>
            <CardTitle>WAF Rules</CardTitle>
          </CardHeader>
          <CardContent>
            {wafRules.length === 0 ? (
              <div className="text-muted-foreground">No WAF rules found.</div>
            ) : (
              <ul className="space-y-2">
                {wafRules.map((rule: any) => (
                  <li key={rule.id} className="border-b pb-2">
                    <span className="font-semibold">{rule.name}</span> <span className="text-xs">({rule.rule_type}, {rule.severity})</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Threat Logs List */}
        <Card>
          <CardHeader>
            <CardTitle>Threat Logs</CardTitle>
          </CardHeader>
          <CardContent>
            {threatLogs.length === 0 ? (
              <div className="text-muted-foreground">No threat logs found.</div>
            ) : (
              <ul className="space-y-3">
                {threatLogs.slice(0, 10).map((log: any) => (
                  <li key={log.id} className="border-b pb-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {log.waf_blocked ? (
                            <span className="text-red-600">Blocked</span>
                          ) : (
                            <span className="text-green-600">Allowed</span>
                          )}
                          {log.threat_level && (
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${log.threat_level === 'high' ? 'bg-red-100 text-red-700' : log.threat_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : log.threat_level === 'low' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{log.threat_level}</span>
                          )}
                        </span>
                        {log.waf_rule_triggered && (
                          <span className="text-xs text-orange-600">Rule: {log.waf_rule_triggered}</span>
                        )}
                        <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                      </div>
                      <div className="flex flex-col md:items-end">
                        <span className="text-xs font-mono">{log.method} {log.path}</span>
                        <span className="text-xs">Status: {log.status_code}</span>
                        <span className="text-xs">IP: {log.client_ip}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlatformDetails;
