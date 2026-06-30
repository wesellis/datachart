/**
 * User Management Service
 * Handles all user operations for the DataChart SaaS platform
 */

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  organization_id: number;
  role?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface UserCreate {
  email: string;
  first_name: string;
  last_name: string;
  password?: string;
  organization_id?: number;
}

interface UserUpdate {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  is_active?: boolean;
  role?: string;
}

interface Organization {
  id: number;
  name: string;
  domain: string;
  subscription_tier: string;
  max_users: number;
  is_active: boolean;
}

class UserService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  private apiUrl = `${this.baseUrl}/api/v1/users`;

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = localStorage.getItem('access_token');
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Current User Operations
  async getCurrentUser(): Promise<UserProfile> {
    return this.makeRequest<UserProfile>('/me');
  }

  async updateCurrentUser(updates: Partial<UserProfile>): Promise<UserProfile> {
    return this.makeRequest<UserProfile>('/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Admin User Management
  async listUsers(params?: {
    page?: number;
    limit?: number;
    organization_id?: number;
    role?: string;
    is_active?: boolean;
  }): Promise<UserProfile[]> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.organization_id) queryParams.append('organization_id', params.organization_id.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
    return this.makeRequest<UserProfile[]>(`/${query}`);
  }

  async getUser(userId: number): Promise<UserProfile> {
    return this.makeRequest<UserProfile>(`/${userId}`);
  }

  async createUser(userData: UserCreate, sendInvitation: boolean = true): Promise<UserProfile> {
    const query = sendInvitation ? '?send_invitation=true' : '?send_invitation=false';
    return this.makeRequest<UserProfile>(`/${query}`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(userId: number, updates: UserUpdate): Promise<UserProfile> {
    return this.makeRequest<UserProfile>(`/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(userId: number, softDelete: boolean = true): Promise<{ message: string }> {
    const query = softDelete ? '?soft_delete=true' : '?soft_delete=false';
    return this.makeRequest<{ message: string }>(`/${userId}${query}`, {
      method: 'DELETE',
    });
  }

  async resetUserPassword(userId: number, sendEmail: boolean = true): Promise<{ message: string; temp_password?: string }> {
    const query = sendEmail ? '?send_email=true' : '?send_email=false';
    return this.makeRequest<{ message: string; temp_password?: string }>(`/${userId}/reset-password`, {
      method: 'POST',
    });
  }

  async updateUserRole(userId: number, roleName: string): Promise<{ message: string }> {
    return this.makeRequest<{ message: string }>(`/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role_name: roleName }),
    });
  }

  // Bulk Operations
  async bulkInviteUsers(invitations: UserCreate[]): Promise<{
    message: string;
    results: Array<{ email: string; status: string; message: string }>;
    success_count: number;
    error_count: number;
  }> {
    return this.makeRequest<any>('/bulk/invite', {
      method: 'POST',
      body: JSON.stringify(invitations),
    });
  }

  // Organization Management (Super Admin only)
  async listOrganizations(): Promise<Organization[]> {
    return this.makeRequest<Organization[]>('/organizations/');
  }

  async createOrganization(orgData: {
    name: string;
    domain: string;
    subscription_tier: string;
    max_users: number;
  }): Promise<Organization> {
    return this.makeRequest<Organization>('/organizations/', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }
}

export const userService = new UserService();
export type { UserProfile, UserCreate, UserUpdate, Organization };