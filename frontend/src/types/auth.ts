// Authentication Types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  organizations: Organization[];
}

export interface Organization {
  id: string;
  name: string;
  plan_type: 'free' | 'pro' | 'enterprise';
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  organization_name?: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used?: string;
  expires_at?: string;
  is_active: boolean;
}

export interface ApiKeyCreate {
  name: string;
  expires_at?: string;
}

export interface PasswordReset {
  token: string;
  new_password: string;
}