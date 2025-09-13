export const API_BASE_URL = 'http://16.16.182.74/api/v1';



// Types for API responses
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  company_name?: string;
  is_verified: boolean;
  role: 'admin' | 'user' | 'viewer';
  created_at: string;
  updated_at: string;
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

export interface DashboardStats {
  total_requests: number;
  blocked_threats: number;
  clean_requests: number;
  active_endpoints: number;
  avg_response_time: number;
  error_rate: number;
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
    // /platforms/<uuid:pk>/analytics/
    const response = await this.request<{success: boolean; analytics: any}>(`/platforms/${platformId}/analytics/`);
    return response.analytics;
  }

  // Threat logs for selected platform
  async getThreatLogs(): Promise<any[]> {
    const platformId = localStorage.getItem('selected_platform_id');
    if (!platformId) throw new Error('No platform selected');
    // /platforms/<uuid:pk>/request-logs/
    const response = await this.request<{success: boolean; logs: any[]}>(`/platforms/${platformId}/request-logs/`);
    return response.logs;
  }
  // Get platform details
  async getPlatformDetails(platformId: string): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
    return res.json();
  }

  // Get endpoints for a platform
  async getPlatformEndpoints(platformId: string): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/endpoints/`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
    return res.json(); // returns { count, next, previous, results }
  }

  // Get WAF rules for a platform
  async getPlatformWAFRules(platformId: string): Promise<any[]> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/waf-rules/?platform_id=${platformId}`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
    const data = await res.json();
    return Array.isArray(data) ? data : (data.results || []);
  }

  // Get request logs for a platform
  async getPlatformRequestLogs(platformId: string): Promise<any[]> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/request-logs/`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
    const data = await res.json();
    if (Array.isArray(data)) {
      return data;
    } else if (Array.isArray(data.logs)) {
      return data.logs;
    } else {
      return [];
    }
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
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/upload-collection/`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
    return res.json();
  }

  // List collections for a platform
  async getCollections(platformId: string): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/collections/`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
    return res.json(); // returns { success, collections, ... }
  }

  // Get analytics for a platform
  async getAnalytics(platformId: string): Promise<any> {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(`${this.baseURL}/platforms/${platformId}/analytics/`, {
      credentials: 'include',
      headers: token ? { 'Authorization': `Token ${token}` } : undefined,
    });
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

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
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
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/auth/logout/', {
        method: 'POST',
      });
    } finally {
      this.token = null;
      localStorage.removeItem('auth_token');
    }
  }

  async register(userData: Record<string, unknown>): Promise<{ message: string; user: User }> {
    return await this.request('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getUserInfo(): Promise<User> {
    return await this.request<User>('/auth/user-info/');
  }

  // API Endpoints methods
  async getEndpoints(): Promise<APIEndpoint[]> {
    const response = await this.request<{count: number; next: string | null; previous: string | null; results: APIEndpoint[]}>(this.addPlatformQuery('/endpoints/'));
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
    await this.request(`/endpoints/${id}/`, {
      method: 'DELETE',
    });
  }

  // WAF Rules methods
  async getWAFRules(): Promise<WAFRule[]> {
    const response = await this.request<{count: number; next: string | null; previous: string | null; results: WAFRule[]}>(this.addPlatformQuery('/waf-rules/'));
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
    await this.request(`/waf-rules/${id}/`, {
      method: 'DELETE',
    });
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
    const response = await this.request<{count: number; next: string | null; previous: string | null; results: User[]}>('/users/');
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
    await this.request(`/users/${id}/`, {
      method: 'DELETE',
    });
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
    return await this.request(`/github/repos/basic/?page=${page}&page_size=${pageSize}`);
  }

  async disconnectGitHub(): Promise<void> {
    await this.request('/github/disconnect/', {
      method: 'DELETE',
    });
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }
}

// Create and export a singleton instance
export const apiService = new APIService();
export default apiService;