// export const API_BASE_URL = 'http://16.16.182.74/api/v1';
// export const API_BASE_URL = 'http://165.245.211.56:8000/api/v1';
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// ── Two-layer TTL cache (L1 in-memory + L2 localStorage) ────────────────────
// L1 lives for the lifetime of the JS module (survives navigation, dies on reload).
// L2 lives in localStorage (survives reloads and app restarts until TTL expires).
// Every entry is version-tagged so a code update automatically invalidates stale data.
// Entries over 150 KB are kept in L1 only (never written to localStorage).
// On logout every key is wiped from both layers.

const CACHE_V = 2;           // bump to invalidate all persisted entries after a schema change
const LS      = '_hc_';      // namespace prefix keeps our keys from colliding with anything else
const MAX_LS  = 150_000;     // bytes — entries larger than this skip localStorage

type CacheEntry = { value: unknown; expires: number; v: number };

const _cache   = new Map<string, CacheEntry>();
const _inflight = new Map<string, Promise<unknown>>(); // in-flight dedup table

function cacheGet<T>(key: string): T | null {
  const now = Date.now();

  const mem = _cache.get(key);
  if (mem) {
    if (mem.v === CACHE_V && now <= mem.expires) return mem.value as T;
    _cache.delete(key);
  }

  try {
    const raw = localStorage.getItem(LS + key);
    if (!raw) return null;
    const e = JSON.parse(raw) as CacheEntry;
    if (!e || e.v !== CACHE_V || now > e.expires || e.value == null) {
      localStorage.removeItem(LS + key);
      return null;
    }
    _cache.set(key, e);
    return e.value as T;
  } catch {
    return null;
  }
}

function cacheSet(key: string, value: unknown, ttlMs: number): void {
  if (value == null) return;
  const e: CacheEntry = { value, expires: Date.now() + ttlMs, v: CACHE_V };
  _cache.set(key, e);
  try {
    const s = JSON.stringify(e);
    if (s.length < MAX_LS) localStorage.setItem(LS + key, s);
  } catch {}
}

export function cacheInvalidate(prefix: string): void {
  [..._cache.keys()].forEach(k => { if (k.startsWith(prefix)) _cache.delete(k); });
  try {
    const rm: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(LS + prefix)) rm.push(k);
    }
    rm.forEach(k => localStorage.removeItem(k));
  } catch {}
}

// dedup: if the same cache key is already being fetched, return the existing
// Promise instead of firing a second network request.
function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const p = _inflight.get(key);
  if (p) return p as Promise<T>;
  const req = fn().finally(() => _inflight.delete(key));
  _inflight.set(key, req);
  return req;
}
// ────────────────────────────────────────────────────────────────────────────

// Types for API responses
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  company?: string | null;
  company_display_name?: string | null;
  company_subdomain?: string | null;
  is_verified: boolean;
  role: 'admin' | 'user' | 'viewer';
  status?: 'active' | 'away';   // ← add this line
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: number;
  email: string;
  message?: string;
  status: 'pending' | 'accepted' | 'cancelled';
  invited_by: string;
  created_at: string;
  expires_at?: string;
}

// Organisation-level invitation interface
export interface OrganisationInvitation {
  id: string;
  email: string;
  role: 'org_admin' | 'org_member';
  organisation_name: string;
  created_at: string;
  expires_at: string;
  token: string;
  status: string;
  invited_by_email?: string;
}

export interface PlatformMember {
  id: string | number;
  user: number; // User ID
  user_email: string;
  user_name: string;
  platform: string;
  platform_name: string;
  invited_by?: number | null;
  invited_by_email?: string | null;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
  role?: 'admin' | 'analyst' | 'viewer'; // Optional, may not be in response
}

export interface InviteRequest {
  email: string;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  message: string;
}

export interface APIEndpoint {
  id: number;
  name: string;
  path: string;
  method: string;
  description?: string;
  status: string;
  is_protected: boolean;
  request_count: number;
  avg_response_time: number;
  error_rate: number;
  created_at: string;
  updated_at: string;
  last_accessed?: string;
}

export interface WAFRule {
  id: number;
  name: string;
  description: string;
  rule_type: string;
  severity: string;
  pattern: string;
  is_active: boolean;
  action: string;
  trigger_count: number;
  created_by_email: string;
  endpoint_count: number;
  created_at: string;
  updated_at: string;
}

export interface ThreatLog {
  id: number;
  threat_type: string;
  status: string;
  severity: string;
  source_ip: string;
  user_agent?: string;
  request_path: string;
  request_method: string;
  response_code?: number;
  response_time?: number;
  endpoint_path: string;
  waf_rule_name?: string;
  user_email?: string;
  details: Record<string, unknown>;
  notes?: string;
  timestamp: string;
}

export interface PlaygroundTestRequest {
  platform_id: string;
  endpoint_path: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  query_params?: Record<string, string>;
}

export interface PlaygroundTestResult {
  success: boolean;
  blocked?: boolean;
  blocked_by?: 'waf' | 'envoy' | 'wasm' | null;
  block_reason?: string;
  request?: {
    method: string;
    url: string;
    headers?: Record<string, unknown>;
    body?: unknown;
    query_params?: Record<string, unknown>;
  };
  response?: {
    status_code: number;
    headers?: Record<string, unknown>;
    body?: unknown;
    response_time_ms?: number;
  };
  platform?: {
    id: string;
    name: string;
    forwarded_port?: number;
  };
  waf_rule_triggered?: string;
  threat_detected?: string;
  message?: string;
}

export interface DashboardStats {
  total_requests: number;
  blocked_threats: number;
  clean_requests: number;
  active_endpoints: number;
  avg_response_time: number;
  error_rate: number;
  success_rate?: number;
  status_code_breakdown?: Record<string, number>;
  threat_types: Record<string, number>;
  recent_threats: ThreatLog[];
}

export interface TrafficData {
  name: string;
  requests: number;
  blocked: number;
  allowed: number;
}

export interface ThreatTypeData {
  name: string;
  value: number;
  color: string;
}

export interface EndpointStatus {
  endpoint: APIEndpoint;
  status: string;
  request_count: number;
  avg_response_time: number;
  error_rate: number;
  last_accessed?: string;
  protection: boolean;
  rules_applied: number;
}

// API service class
class APIService {
  // Dashboard stats for selected platform
  async getDashboardStats(): Promise<any> {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) throw new Error('No platform selected');
    const response = await this.request<any>(`/dashboard/?platform_id=${platformId}`);
    return response;
  }

  // Threat logs for selected platform
  async getThreatLogs(): Promise<any[]> {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) throw new Error('No platform selected');
    const response = await this.request<{success: boolean; logs: any[]}>(`/platforms/${platformId}/request-logs/`);
    return response.logs;
  }

  // Get platform details
  async getPlatformDetails(platformId: string): Promise<any> {
    const cacheKey = `platform:${platformId}`;
    const hit = cacheGet<any>(cacheKey);
    if (hit) return hit;
    return dedup(cacheKey, async () => {
      const res = await fetch(`${this.baseURL}/platforms/${platformId}/`, {
        credentials: 'include',
        headers: this.authHeaders(),
      });
      const data = await res.json();
      cacheSet(cacheKey, data, 300_000);
      return data;
    });
  }

  // Get endpoints for a platform
  async getPlatformEndpoints(platformId: string): Promise<any> {
    const cacheKey = `endpoints:${platformId}`;
    const hit = cacheGet<any>(cacheKey);
    if (hit) return hit;
    return dedup(cacheKey, async () => {
      const res = await fetch(`${this.baseURL}/platforms/${platformId}/endpoints/`, {
        credentials: 'include',
        headers: this.authHeaders(),
      });
      const data = await res.json();
      cacheSet(cacheKey, data, 300_000);
      return data;
    });
  }

  // Get WAF rules for a platform
  async getPlatformWAFRules(platformId: string): Promise<any[]> {
    const cacheKey = `waf-rules:${platformId}`;
    const hit = cacheGet<any[]>(cacheKey);
    if (hit) return hit;
    return dedup(cacheKey, async () => {
      const res = await fetch(`${this.baseURL}/waf-rules/?platform_id=${platformId}`, {
        credentials: 'include',
        headers: this.authHeaders(),
      });
      const data = await res.json();
      const result = Array.isArray(data) ? data : (data.results || []);
      cacheSet(cacheKey, result, 300_000);
      return result;
    });
  }


  // Get threat (blocked) request logs for a platform
  async getPlatformThreatLogs(platformId: string, params?: { range?: string; page?: string; start?: string; end?: string; path?: string }): Promise<any> {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const fullUrl = `${this.baseURL}/platforms/${platformId}/request-logs/${query}`;
    const res = await fetch(fullUrl, {
      credentials: 'include',
      headers: this.authHeaders(),
    });
    return res.json();
  }

  // Upload collection to platform
  async uploadCollection(platformId: string, collectionType: string, fileOrData: File | object): Promise<any> {
    const formData = new FormData();
    formData.append('collection_type', collectionType);
    if (fileOrData instanceof File) {
      formData.append('collection_file', fileOrData);
    } else {
      formData.append('collection_data', JSON.stringify(fileOrData));
    }
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/upload-collection/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: this.authHeaders(),
    });
    return res.json();
  }

  // List collections for a platform
  async getCollections(platformId: string): Promise<any> {
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/collections/`, {
      credentials: 'include',
      headers: this.authHeaders(),
    });
    return res.json();
  }

  // Get analytics for a platform
  async getAnalytics(platformId: string, params?: { range?: string; start?: string; end?: string }): Promise<any> {
    const query = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    const cacheKey = `analytics:${platformId}${query}`;
    const hit = cacheGet<any>(cacheKey);
    if (hit) return hit;
    return dedup(cacheKey, async () => {
      const res = await fetch(`${this.baseURL}/platforms/${platformId}/analytics/${query}`, {
        credentials: 'include',
        headers: this.authHeaders(),
      });
      const data = await res.json();
      cacheSet(cacheKey, data, 180_000);
      return data;
    });
  }

  // Get analytics for a specific endpoint (cached 60 s)
  async getEndpointAnalytics(endpointId: string): Promise<any> {
    const cacheKey = `endpoint-analytics:${endpointId}`;
    const hit = cacheGet<any>(cacheKey);
    if (hit) return hit;
    return dedup(cacheKey, async () => {
      const data = await this.request<any>(`/api-endpoints/${endpointId}/analytics/`, { method: 'GET' });
      cacheSet(cacheKey, data, 60_000);
      return data;
    });
  }

  // PATCH an endpoint's fields (is_shadow, is_protected, status, etc.)
  async updateEndpoint(endpointId: string, fields: Record<string, unknown>): Promise<any> {
    const res = await fetch(`${this.baseURL}/api-endpoints/${endpointId}/`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(fields),
    });
    // Bust endpoint list cache so the UI reflects the change
    cacheInvalidate('endpoints:');
    return res.json();
  }

  // Send WAF log
  async sendWAFLog(logData: object): Promise<any> {
    const res = await fetch(`${this.baseURL}/waf/log-request/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logData),
    });
    return res.json();
  }

  // Detect collection type
  async detectCollectionType(collectionDataOrFile: File | object): Promise<any> {
    const formData = new FormData();
    if (collectionDataOrFile instanceof File) {
      formData.append('collection_file', collectionDataOrFile);
    } else {
      formData.append('collection_data', JSON.stringify(collectionDataOrFile));
    }
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/platforms/detect-collection-type/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
    return res.json();
  }

  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private getPlatformId(): string | null {
    return localStorage.getItem('selected_platform_id');
  }

  private addPlatformQuery(endpoint: string): string {
    const platformId = this.getPlatformId();
    if (platformId) {
      const separator = endpoint.includes('?') ? '&' : '?';
      return `${endpoint}${separator}platform_id=${platformId}`;
    }
    return endpoint;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Token ${this.token}`;
    }
    const subdomain = localStorage.getItem('tenant_subdomain');
    if (subdomain) {
      headers['X-Tenant-Subdomain'] = subdomain;
    }
    return headers;
  }

  private authHeaders(): Record<string, string> {
    const token = localStorage.getItem('auth_token');
    const subdomain = localStorage.getItem('tenant_subdomain');
    const h: Record<string, string> = {};
    if (token) h['Authorization'] = `Token ${token}`;
    if (subdomain) h['X-Tenant-Subdomain'] = subdomain;
    return h;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        let errorData: any = {};
        if (text) {
          try {
            errorData = JSON.parse(text);
          } catch {
            errorData = text;
          }
        }
        const err = new Error(
          (errorData && (errorData.detail || errorData.message)) ||
          (typeof errorData === 'string' ? errorData : JSON.stringify(errorData)) ||
          `HTTP error! status: ${response.status}`
        );
        (err as any).status = response.status;
        (err as any).statusText = response.statusText;
        (err as any).body = errorData;
        throw err;
      }
      const text = await response.text().catch(() => '');
      if (!text) return {} as T;
      try {
        return JSON.parse(text) as T;
      } catch {
        return text as unknown as T;
      }
    } catch (error) {
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.token = response.token;
    localStorage.setItem('auth_token', response.token);
    if (response.user?.company_subdomain) {
      localStorage.setItem('tenant_subdomain', response.user.company_subdomain);
    }
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout/', { method: 'POST' });
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_subdomain');
      cacheInvalidate('user-info');
      cacheInvalidate('platform:');
      cacheInvalidate('endpoints:');
      cacheInvalidate('analytics:');
      cacheInvalidate('members:');
      cacheInvalidate('waf-rules:');
    }
  }

  async register(userData: {
    email: string;
    password: string;
    password_confirm: string;
    first_name: string;
    last_name: string;
    phone_number?: string;
    company_name?: string;
    subdomain?: string;
  }): Promise<{ message: string; user: User }> {
    const csrfToken = this.getCSRFToken();
    return await this.request('/auth/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify(userData),
    });
  }

  async passwordReset(email: string): Promise<{ message: string }> {
    const csrfToken = this.getCSRFToken();
    return await this.request('/password-reset/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify({ email }),
    });
  }

  async passwordResetConfirm(data: {
    token: { uid: string; token: string };
    new_password: string;
    new_password_confirm: string;
  }): Promise<{ message: string }> {
    const csrfToken = this.getCSRFToken();
    return await this.request('/password-reset-confirm/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
  }

  private getCSRFToken = () => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === 'csrftoken') return value;
    }
    return null;
  };

  async getUserInfo(): Promise<User> {
    const hit = cacheGet<User>('user-info');
    if (hit) return hit;
    return dedup('user-info', async () => {
      const data = await this.request<User>('/auth/user-info/');
      cacheSet('user-info', data, 300_000);
      return data;
    });
  }
  // Get current user's status
async getUserStatus(): Promise<{ status: 'active' | 'away' }> {
    return await this.request<{ status: 'active' | 'away' }>('/auth/user-status/');
}

// Update current user's status
async updateUserStatus(status: 'active' | 'away'): Promise<{ status: 'active' | 'away' }> {
    return await this.request<{ status: 'active' | 'away' }>('/auth/user-status/', {
        method: 'PUT',
        body: JSON.stringify({ status }),
    });
}

  // API Endpoints methods
  async getEndpoints(): Promise<APIEndpoint[]> {
    const response = await this.request<{
      count: number;
      next: string | null;
      previous: string | null;
      results: APIEndpoint[];
    }>(this.addPlatformQuery('/endpoints/'));
    return response.results;
  }

  async getEndpoint(id: number): Promise<APIEndpoint> {
    return await this.request<APIEndpoint>(`/endpoints/${id}/`);
  }

  async createEndpoint(endpointData: Partial<APIEndpoint>): Promise<APIEndpoint> {
    return await this.request<APIEndpoint>('/endpoints/', {
      method: 'POST',
      body: JSON.stringify(endpointData),
    });
  }

  async updateEndpoint(id: number, endpointData: Partial<APIEndpoint>): Promise<APIEndpoint> {
    return await this.request<APIEndpoint>(`/endpoints/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(endpointData),
    });
  }

  async deleteEndpoint(id: number): Promise<void> {
    await this.request(`/endpoints/${id}/`, { method: 'DELETE' });
  }

  // WAF Rules methods
  async getWAFRules(): Promise<WAFRule[]> {
    const response = await this.request<{
      count: number;
      next: string | null;
      previous: string | null;
      results: WAFRule[];
    }>(this.addPlatformQuery('/waf-rules/'));
    return response.results;
  }

  async getWAFRule(id: number): Promise<WAFRule> {
    return await this.request<WAFRule>(`/waf-rules/${id}/`);
  }

  async createWAFRule(ruleData: Partial<WAFRule>): Promise<WAFRule> {
    return await this.request<WAFRule>('/waf-rules/', {
      method: 'POST',
      body: JSON.stringify(ruleData),
    });
  }

  async updateWAFRule(id: number, ruleData: Partial<WAFRule>): Promise<WAFRule> {
    return await this.request<WAFRule>(`/waf-rules/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(ruleData),
    });
  }

  async deleteWAFRule(id: number): Promise<void> {
    await this.request(`/waf-rules/${id}/`, { method: 'DELETE' });
  }

  async getTrafficData(): Promise<TrafficData[]> {
    return await this.request<TrafficData[]>(this.addPlatformQuery('/dashboard/traffic/'));
  }

  async getThreatTypeData(): Promise<ThreatTypeData[]> {
    return await this.request<ThreatTypeData[]>(this.addPlatformQuery('/dashboard/threat-types/'));
  }

  async getEndpointStatus(): Promise<EndpointStatus[]> {
    return await this.request<EndpointStatus[]>('/dashboard/endpoint-status/');
  }

  // Users methods
  async getUsers(): Promise<User[]> {
    const response = await this.request<{ count: number; next: string | null; previous: string | null; results: User[] }>('/users/');
    return response.results;
  }

  async getUser(id: number): Promise<User> {
    return await this.request<User>(`/users/${id}/`);
  }

  async createUser(userData: Partial<User>): Promise<User> {
    return await this.request<User>('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    return await this.request<User>(`/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: number): Promise<void> {
    await this.request(`/users/${id}/`, { method: 'DELETE' });
  }

  // GitHub App methods
  async getGitHubStatus(): Promise<any> {
    return await this.request('/github/status/');
  }

  async getGitHubAppInstallUrl(): Promise<{ install_url: string }> {
    return await this.request('/auth/github/login/');
  }

  async processGitHubInstallation(installationData: {
    installation_id?: string;
    setup_action?: string;
    code?: string;
  }): Promise<any> {
    return await this.request('/auth/github/details/', {
      method: 'POST',
      body: JSON.stringify(installationData),
    });
  }

  async getGitHubRepos(page: number = 1, pageSize: number = 20): Promise<any> {
    return await this.request(this.addPlatformQuery(`/github/repos/basic/?page=${page}&page_size=${pageSize}`));
  }

  async getRepositoryBranches(repoUrl: string, platformId: string): Promise<{ branches: string[]; default_branch: string; count: number }> {
    return await this.request(`/repos/branches/?repo_url=${encodeURIComponent(repoUrl)}&platform_id=${platformId}`);
  }

  async disconnectGitHub(): Promise<void> {
    await this.request('/github/disconnect/', { method: 'DELETE' });
  }

  // Playground test method
  async testPlaygroundRequest(testData: PlaygroundTestRequest): Promise<PlaygroundTestResult> {
    return await this.request<PlaygroundTestResult>('/playground/', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  // Blacklist methods
  async getBlacklist(platformId: string): Promise<any[]> {
    const res = await fetch(`${this.baseURL}/blacklist/?platform_uuid=${platformId}`, {
      credentials: 'include',
      headers: this.getHeaders(),
    });
    return res.json();
  }

  async addToBlacklist(data: { platform_uuid: string; ip: string }): Promise<any> {
    const payload = { platform: data.platform_uuid, ip: data.ip };
    const res = await fetch(`${this.baseURL}/blacklist/`, {
      method: 'POST',
      credentials: 'include',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to add IP to blacklist');
    return res.json();
  }

  async removeFromBlacklist(id: string): Promise<void> {
  const res = await fetch(`${this.baseURL}/blacklist/${id}/`, {
    method: 'DELETE',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
  });
  if (!res.ok && res.status !== 204) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`Failed to remove IP: ${res.status} ${errorText}`);
  }
}

  // Update platform details
  async updatePlatform(platformId: string, data: { application_url?: string; listening_port?: string; forwarded_port?: string; name?: string }): Promise<any> {
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to update platform');
    }
    return res.json();
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  // Get alerts for a platform
  async getAlerts(platformId?: string): Promise<any[]> {
    const query = platformId ? `?platform_uuid=${platformId}` : '';
    return await this.request<any[]>(`/alerts/${query}`);
  }

  // Get alert triggers
  async getAlertTriggers(platformId?: string, params?: { page?: string; page_size?: string; range?: string; start?: string; end?: string }): Promise<any> {
    const baseQuery: Record<string, string> = {};
    if (platformId) baseQuery.platform_uuid = platformId;
    if (params) Object.assign(baseQuery, params);
    const query = Object.keys(baseQuery).length ? '?' + new URLSearchParams(baseQuery).toString() : '';
    const fullUrl = `${this.baseURL}/alerts/triggers/${query}`;
    const res = await fetch(fullUrl, {
      credentials: 'include',
      headers: this.authHeaders(),
    });
    return res.json();
  }

  async createAlert(alertData: {
    platform_uuid: string;
    alert_type: string;
    name: string;
    description?: string;
    severity: string;
    status?: string;
    configuration: Record<string, any>;
    notification_channels: string[];
    notification_settings: Record<string, string>;
  }): Promise<any> {
    return await this.request<any>('/alerts/', {
      method: 'POST',
      body: JSON.stringify(alertData),
    });
  }

  async updateAlertStatus(alertId: string, status: string): Promise<any> {
    return await this.request<any>(`/alerts/${alertId}/`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateAlert(alertId: string, alertData: {
    notification_channels?: string[];
    slack_webhook?: string;
    teams_webhook?: string;
    email?: string;
    webhook_url?: string;
    [key: string]: any;
  }): Promise<any> {
    return await this.request<any>(`/alerts/${alertId}/`, {
      method: 'PUT',
      body: JSON.stringify(alertData),
    });
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.request(`/alerts/${alertId}/`, { method: 'DELETE' });
  }

  // Get audit logs
  async getAuditLogs(params?: {
    platform_id?: string;
    resource_type?: string;
    search?: string;
    action?: string;
    start_date?: string;
    end_date?: string;
    user?: string;
    page?: string;
    page_size?: string;
  }): Promise<any> {
    const platformId = params?.platform_id || this.getPlatformId();
    if (!platformId) throw new Error('Platform ID is required for audit logs');
    const queryParams: Record<string, string> = { platform_id: platformId };
    if (params?.resource_type) queryParams.resource_type = params.resource_type;
    if (params?.search) queryParams.search = params.search;
    if (params?.action) queryParams.action = params.action;
    if (params?.start_date) queryParams.start_date = params.start_date;
    if (params?.end_date) queryParams.end_date = params.end_date;
    if (params?.user) queryParams.user = params.user;
    if (params?.page) queryParams.page = params.page;
    if (params?.page_size) queryParams.page_size = params.page_size;
    const query = '?' + new URLSearchParams(queryParams).toString();
    return await this.request<any>(`/audit-logs/${query}`);
  }

  // Get incidents for a platform
  async getIncidents(platformId?: string): Promise<any[]> {
    const query = platformId ? `?platform_uuid=${platformId}` : '';
    return await this.request<any[]>(`/incidents/${query}`);
  }

  async createIncident(incidentData: Record<string, any>): Promise<any> {
    return await this.request<any>('/incidents/', {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });
  }

  async updateIncident(incidentId: string, incidentData: Record<string, any>): Promise<any> {
    if (!incidentData.platform_uuid) {
      const platformId = this.getPlatformId();
      if (platformId) incidentData.platform_uuid = platformId;
    }
    return await this.request<any>(`/incidents/${incidentId}/`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });
  }

  // Fetch the last 10 logs for platform details
  async getPlatformLogs(platformId: string): Promise<any[]> {
    return await this.request<any[]>(`/platforms/${platformId}/request-logs/`);
  }

  async getSecurityHubLogs(platformId: string): Promise<any[]> {
    return await this.request<any[]>(`/platforms/${platformId}/request-logs/?num=100`);
  }

  async getBlockedThreatLogs(platformId: string): Promise<any[]> {
    return await this.request<any[]>(`/platforms/${platformId}/request-logs/?blocked=true`);
  }

  // Invitation Management (platform-level)
  async sendInvitation(platformId: string, invitationData: InviteRequest): Promise<Invitation> {
    return await this.request<Invitation>(`/platforms/${platformId}/invitations/`, {
      method: 'POST',
      body: JSON.stringify(invitationData),
    });
  }

  async getInvitations(platformId: string): Promise<Invitation[]> {
    return await this.request<Invitation[]>(`/platforms/${platformId}/invitations/`);
  }

  async cancelInvitation(invitationId: string): Promise<void> {
  return await this.request<void>(`/auth/invitations/${invitationId}/cancel/`, {
    method: 'DELETE',
  });
}

  async getInvitationByToken(token: string): Promise<any> {
    return await this.request<any>(`/invitations/accept/${token}/`, { method: 'GET' });
  }

  async acceptInvitation(token: string): Promise<any> {
    return await this.request<any>(`/invitations/accept/${token}/`, { method: 'POST' });
  }

  // Organisation‑level invitations (for user's own pending invites)
  async getMyInvitations(type: 'received' | 'sent' = 'received'): Promise<OrganisationInvitation[]> {
    const res = await fetch(`${this.baseURL}/auth/invitations/?type=${type}`, {
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
    });
    if (!res.ok) throw new Error('Failed to fetch invitations');
    return res.json();
  }

  async acceptOrganisationInvitation(token: string): Promise<any> {
    const res = await fetch(`${this.baseURL}/auth/invitations/accept/${token}/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to accept invitation');
    }
    return res.json();
  }

  // Get all workspaces (platforms) for the current organisation
  async getWorkspaces(): Promise<any[]> {
    const res = await fetch(`${this.baseURL}/platforms/`, {
      credentials: 'include',
      headers: this.authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch workspaces');
    const data = await res.json();
    return Array.isArray(data) ? data : data.results || [];
  }

  // Create an organisation‑level invitation
  async createOrganisationInvitation(data: {
    email: string;
    role: 'org_admin' | 'org_member';
    workspace_ids?: string[];
  }): Promise<any> {
    const res = await fetch(`${this.baseURL}/auth/invitations/create/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...this.authHeaders() },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.error || error.message || 'Failed to send invitation');
    }
    return res.json();
  }

  // Platform Member Management
  async getPlatformMembers(platformId: string): Promise<PlatformMember[]> {
    const cacheKey = `members:${platformId}`;
    const hit = cacheGet<PlatformMember[]>(cacheKey);
    if (hit) return hit;
    return dedup(cacheKey, async () => {
      const response = await this.request<any>(`/platforms/${platformId}/members/`);
      let members: PlatformMember[];
      if (response && typeof response === 'object' && 'results' in response) members = response.results;
      else if (Array.isArray(response)) members = response;
      else members = [];
      cacheSet(cacheKey, members, 300_000);
      return members;
    });
  }

  async removeMember(platformId: string, memberId: string): Promise<void> {
    return await this.request<void>(`/platforms/${platformId}/members/${memberId}/`, { method: 'DELETE' });
}

  // Repository Scan Configuration
  async activateRepositoryScan(data: {
    repo_id?: string;
    repo_url?: string;
    platform_id: string;
    scan_on_push?: boolean;
    scan_on_pr_created?: boolean;
    scan_on_pr_updated?: boolean;
    push_scan_branches?: string[];
    pr_target_branches?: string[];
    auto_post_comments?: boolean;
    min_severity_for_comments?: 'critical' | 'high' | 'medium' | 'low';
  }): Promise<any> {
    const cleanedData = { ...data };
    if (cleanedData.repo_id) cleanedData.repo_id = cleanedData.repo_id.replace(/[{}]/g, '');
    return await this.request<any>('/repository-scan/activate/', {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    });
  }

  async deactivateRepositoryScan(data: { repo_id?: string; repo_url?: string; platform_id: string }): Promise<any> {
    const cleanedData = { ...data };
    if (cleanedData.repo_id) cleanedData.repo_id = cleanedData.repo_id.replace(/[{}]/g, '');
    return await this.request<any>('/repository-scan/deactivate/', {
      method: 'POST',
      body: JSON.stringify(cleanedData),
    });
  }

  async getRepositoryScanConfig(repoId: string, platformId: string, repoUrl?: string): Promise<any> {
    const cleanedRepoId = repoId.replace(/[{}]/g, '');
    let url = `/repository-scan/config/?platform_id=${platformId}`;
    if (cleanedRepoId) url += `&repo_id=${encodeURIComponent(cleanedRepoId)}`;
    if (repoUrl) url += `&repo_url=${encodeURIComponent(repoUrl)}`;
    return await this.request<any>(url);
  }

  async getAutomatedRuns(params?: {
    platform_id: string;
    repo_id?: string;
    status?: 'Queued' | 'In Progress' | 'Completed' | 'Failed';
    trigger_type?: 'webhook_push' | 'webhook_pr_created' | 'webhook_pr_updated';
    pr_id?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    if (!params?.platform_id) throw new Error('platform_id is required');
    const queryParams: Record<string, string> = { platform_id: params.platform_id };
    if (params.repo_id) queryParams.repo_id = params.repo_id;
    if (params.status) queryParams.status = params.status;
    if (params.trigger_type) queryParams.trigger_type = params.trigger_type;
    if (params.pr_id) queryParams.pr_id = params.pr_id;
    if (params.page) queryParams.page = String(params.page);
    if (params.page_size) queryParams.page_size = String(params.page_size);
    const query = '?' + new URLSearchParams(queryParams).toString();
    const res = await fetch(`${this.baseURL}/automated-runs/${query}`, {
      credentials: 'include',
      headers: this.authHeaders(),
    });
    return res.json();
  }
  async getPlatformRequestLogs(platformId: string, params?: {
  range?: string;
  start?: string;
  end?: string;
  num?: string;
  page?: number;
  page_size?: number;
  start_date?: string;
  end_date?: string;
}): Promise<any> {
  const query = params ? '?' + new URLSearchParams(params as Record<string, any>).toString() : '';
  const fullUrl = `${this.baseURL}/platforms/${platformId}/request-logs/${query}`;
  const res = await fetch(fullUrl, {
    credentials: 'include',
    headers: this.authHeaders(),
  });
  const data = await res.json();
  
  // Backward compatibility: if using old 'num' param, data might be an array
  if (Array.isArray(data)) {
    return data;
  }
  // New paginated response
  if (data.results !== undefined) {
    return data;
  }
  // Fallback
  return data;
}

  async getAutomatedRunDetails(automatedRunId: string): Promise<any> {
    const res = await fetch(`${this.baseURL}/automated-runs/${automatedRunId}/`, {
      credentials: 'include',
      headers: this.authHeaders(),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || 'Failed to fetch automated run details');
    }
    return res.json();
  }
}


// Create and export a singleton instance
export const apiService = new APIService();
export default apiService;