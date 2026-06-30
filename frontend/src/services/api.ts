// API Service Layer for DataChart Dashboard
import { Dashboard, DashboardSummary, DashboardCreate, DashboardUpdate } from '../types/dashboard';
import { DataSource, DataSourceCreate, DataSourceResponse } from '../types/dataSource';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';

// Token management
class TokenManager {
  private static accessToken: string | null = null;
  private static refreshToken: string | null = null;

  static setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
  }

  static getAccessToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('access_token');
    }
    return this.accessToken;
  }

  static getRefreshToken(): string | null {
    if (!this.refreshToken) {
      this.refreshToken = localStorage.getItem('refresh_token');
    }
    return this.refreshToken;
  }

  static clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  static async refreshAccessToken(): Promise<boolean> {
    const refresh = this.getRefreshToken();
    if (!refresh) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refresh }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.access_token, data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

// Base API client with automatic token handling
class ApiClient {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = TokenManager.getAccessToken();

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    let response = await fetch(url, config);

    // Handle token refresh
    if (response.status === 401 && token) {
      const refreshed = await TokenManager.refreshAccessToken();
      if (refreshed) {
        const newToken = TokenManager.getAccessToken();
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };
        response = await fetch(url, config);
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  static get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  static post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Authentication API
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    // Backend expects form data for login
    const formData = new FormData();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }
    
    const tokenData = await response.json();
    TokenManager.setTokens(tokenData.access_token, tokenData.refresh_token);
    
    // Get user data after successful login
    const user = await ApiClient.get<User>('/api/v1/auth/me');
    
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      user,
    };
  },

  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    // Registration expects JSON
    const user = await ApiClient.post<User>('/api/v1/auth/register', userData);
    
    // Now login to get tokens
    const loginResponse = await authApi.login({
      email: userData.email,
      password: userData.password,
    });
    
    return loginResponse;
  },

  logout: () => {
    TokenManager.clearTokens();
    return Promise.resolve();
  },

  getCurrentUser: (): Promise<User> => {
    return ApiClient.get<User>('/api/v1/auth/me');
  },

  refreshToken: (): Promise<boolean> => {
    return TokenManager.refreshAccessToken();
  },

  forgotPassword: (email: string): Promise<{ message: string }> => {
    return ApiClient.post('/api/v1/auth/forgot-password', { email });
  },

  resetPassword: (token: string, newPassword: string): Promise<{ message: string }> => {
    return ApiClient.post('/api/v1/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  },

  // User management methods
  updateCurrentUser: (updates: any): Promise<User> => {
    return ApiClient.put<User>('/api/v1/auth/me', updates);
  },

  getUsers: (params?: any): Promise<any> => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.per_page) searchParams.append('per_page', params.per_page.toString());
    if (params?.search) searchParams.append('search', params.search);
    
    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return ApiClient.get(`/api/v1/users${query}`);
  },

  getUserById: (id: number): Promise<User> => {
    return ApiClient.get<User>(`/api/v1/users/${id}`);
  },

  createUser: (userData: any): Promise<User> => {
    return ApiClient.post<User>('/api/v1/users', userData);
  },

  updateUser: (id: number, updates: any): Promise<User> => {
    return ApiClient.put<User>(`/api/v1/users/${id}`, updates);
  },

  deleteUser: (id: number): Promise<{ message: string }> => {
    return ApiClient.delete(`/api/v1/users/${id}`);
  },

  getRoles: (): Promise<any[]> => {
    return ApiClient.get('/api/v1/users/roles');
  },

  getPermissions: (): Promise<any[]> => {
    return ApiClient.get('/api/v1/users/permissions');
  },

  inviteUser: (data: { email: string; role_id: number }): Promise<{ message: string }> => {
    return ApiClient.post('/api/v1/users/invite', data);
  },

  resendInvitation: (data: { email: string }): Promise<{ message: string }> => {
    return ApiClient.post('/api/v1/users/resend-invitation', data);
  },

  changeUserPassword: (data: { user_id: number; new_password: string; require_reset: boolean }): Promise<{ message: string }> => {
    return ApiClient.post('/api/v1/users/change-password', data);
  },
};

// Dashboard API
export const dashboardApi = {
  getAll: (): Promise<DashboardSummary[]> => {
    return ApiClient.get<DashboardSummary[]>('/api/v1/dashboards/');
  },

  getById: (id: string): Promise<Dashboard> => {
    return ApiClient.get<Dashboard>(`/api/v1/dashboards/${id}`);
  },

  create: (dashboard: DashboardCreate): Promise<Dashboard> => {
    return ApiClient.post<Dashboard>('/api/v1/dashboards/', dashboard);
  },

  update: (id: string, dashboard: DashboardUpdate): Promise<Dashboard> => {
    return ApiClient.put<Dashboard>(`/api/v1/dashboards/${id}`, dashboard);
  },

  delete: (id: string): Promise<{ message: string }> => {
    return ApiClient.delete<{ message: string }>(`/api/v1/dashboards/${id}`);
  },

  duplicate: (id: string, name?: string): Promise<Dashboard> => {
    return ApiClient.post<Dashboard>(`/api/v1/dashboards/${id}/duplicate`, {
      name,
    });
  },

  share: (id: string, permissions: any): Promise<{ share_token: string; share_url: string }> => {
    return ApiClient.post(`/api/v1/dashboards/${id}/share`, permissions);
  },

  getVersions: (id: string): Promise<any[]> => {
    return ApiClient.get(`/api/v1/dashboards/${id}/versions`);
  },

  restoreVersion: (id: string, versionId: string): Promise<Dashboard> => {
    return ApiClient.post<Dashboard>(`/api/v1/dashboards/${id}/versions/${versionId}/restore`, {});
  },
};

// Data Source API
export const dataSourceApi = {
  getAll: (): Promise<DataSourceResponse[]> => {
    return ApiClient.get<DataSourceResponse[]>('/api/v1/data-sources/');
  },

  getById: (id: string): Promise<DataSourceResponse> => {
    return ApiClient.get<DataSourceResponse>(`/api/v1/data-sources/${id}`);
  },

  create: (dataSource: DataSourceCreate): Promise<DataSourceResponse> => {
    return ApiClient.post<DataSourceResponse>('/api/v1/data-sources/', dataSource);
  },

  testConnection: (id: string): Promise<{ success: boolean; message: string }> => {
    return ApiClient.get(`/api/v1/data-sources/${id}/test`);
  },

  getSchema: (id: string): Promise<Record<string, any[]>> => {
    return ApiClient.get(`/api/v1/data-sources/${id}/schema`);
  },

  executeQuery: (
    id: string,
    query: string,
    parameters?: Record<string, any>,
    limit?: number
  ): Promise<{
    success: boolean;
    data: any[];
    row_count: number;
    column_count: number;
    columns: string[];
    execution_time_seconds: number;
  }> => {
    return ApiClient.post(`/api/v1/data-sources/${id}/query`, {
      query,
      parameters,
      limit,
    });
  },

  getSampleQueries: (id: string): Promise<{
    data_source_id: string;
    sample_queries: Array<{ name: string; description: string; query: string }>;
  }> => {
    return ApiClient.get(`/api/v1/data-sources/${id}/sample-queries`);
  },

  getTableInfo: (id: string, tableName: string): Promise<any> => {
    return ApiClient.get(`/api/v1/data-sources/${id}/tables/${tableName}`);
  },

  delete: (id: string): Promise<{ message: string }> => {
    return ApiClient.delete(`/api/v1/data-sources/${id}`);
  },
};

// WebSocket connection manager
export class WebSocketManager {
  private ws: WebSocket | null = null;
  private dashboardId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(dashboardId: string, userId: string, userName: string) {
    this.dashboardId = dashboardId;
    const token = TokenManager.getAccessToken();
    
    if (!token) {
      console.error('No access token available for WebSocket connection');
      return;
    }

    const wsUrl = `${WS_BASE_URL}/ws/dashboards/${dashboardId}?token=${token}&user_id=${userId}&user_name=${encodeURIComponent(userName)}`;
    
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected to dashboard:', dashboardId);
      this.reconnectAttempts = 0;
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return this.ws;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.dashboardId) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (this.dashboardId) {
          // You'll need to pass user info from context
          // This is a simplified version
          this.connect(this.dashboardId, '', '');
        }
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  sendMessage(type: string, data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.dashboardId = null;
    this.reconnectAttempts = 0;
  }

  onMessage(callback: (message: any) => void) {
    if (this.ws) {
      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          callback(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
    }
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();

// Utility functions
export const api = {
  auth: authApi,
  dashboards: dashboardApi,
  dataSources: dataSourceApi,
};

export default api;