/**
 * Billing Service
 * Handles subscription management, billing, and payment operations
 */

interface SubscriptionPlan {
  name: string;
  price: number;
  price_id: string | null;
  features: string[];
  limits: {
    max_users: number;
    max_dashboards: number;
    max_data_sources: number;
    max_widgets_per_dashboard: number;
  };
}

interface UsageStats {
  current_usage: {
    users: number;
    dashboards: number;
    data_sources: number;
  };
  limits: {
    max_users: number;
    max_dashboards: number;
    max_data_sources: number;
    max_widgets_per_dashboard: number;
  };
  plan: string;
  status: string;
  usage_percentage: {
    users: number;
    dashboards: number;
    data_sources: number;
  };
}

interface SubscriptionInfo {
  subscription: any | null;
  plan: string;
  status: string;
}

interface CreateCheckoutRequest {
  plan: string;
  success_url: string;
  cancel_url: string;
}

interface CreateSubscriptionRequest {
  plan: string;
  payment_method_id: string;
}

class BillingService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  private apiUrl = `${this.baseUrl}/api/v1/billing`;

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

  // Plans
  async getPlans(): Promise<{ plans: Record<string, SubscriptionPlan> }> {
    return this.makeRequest<{ plans: Record<string, SubscriptionPlan> }>('/plans');
  }

  // Usage Statistics
  async getUsageStats(): Promise<UsageStats> {
    return this.makeRequest<UsageStats>('/usage');
  }

  // Subscription Management
  async getSubscription(): Promise<SubscriptionInfo> {
    return this.makeRequest<SubscriptionInfo>('/subscription');
  }

  async createSubscription(request: CreateSubscriptionRequest): Promise<{
    subscription_id: string;
    status: string;
    current_period_end: number;
    message: string;
  }> {
    return this.makeRequest('/subscription', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateSubscription(plan: string): Promise<{ message: string; subscription: any }> {
    return this.makeRequest('/subscription', {
      method: 'PUT',
      body: JSON.stringify({ plan }),
    });
  }

  async cancelSubscription(atPeriodEnd: boolean = true): Promise<{ message: string; cancelled: boolean }> {
    return this.makeRequest(`/subscription?at_period_end=${atPeriodEnd}`, {
      method: 'DELETE',
    });
  }

  // Checkout & Portal
  async createCheckoutSession(request: CreateCheckoutRequest): Promise<{
    checkout_url: string;
    session_id: string;
  }> {
    return this.makeRequest('/checkout', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async createBillingPortal(returnUrl: string): Promise<{ portal_url: string }> {
    return this.makeRequest('/portal', {
      method: 'POST',
      body: JSON.stringify({ return_url: returnUrl }),
    });
  }

  // Customer Management (Admin only)
  async createCustomer(organizationId: number): Promise<{ customer_id: string; message: string }> {
    return this.makeRequest('/customer', {
      method: 'POST',
      body: JSON.stringify({ organization_id: organizationId }),
    });
  }

  // Utility methods
  formatPrice(cents: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  }

  formatPlanPrice(plan: SubscriptionPlan): string {
    if (plan.price === 0) return 'Free';
    return `$${plan.price}/month`;
  }

  getPlanColor(plan: string): string {
    switch (plan) {
      case 'free': return 'gray';
      case 'starter': return 'blue';
      case 'professional': return 'purple';
      case 'enterprise': return 'gold';
      default: return 'gray';
    }
  }

  getUsageColor(percentage: number): string {
    if (percentage >= 90) return 'red';
    if (percentage >= 70) return 'yellow';
    return 'green';
  }

  isLimitUnlimited(limit: number): boolean {
    return limit === -1;
  }

  formatLimit(limit: number): string {
    return this.isLimitUnlimited(limit) ? 'Unlimited' : limit.toString();
  }

  // Mock Stripe integration (for development)
  async mockStripeCheckout(plan: string): Promise<string> {
    // In production, this would use Stripe's client-side SDK
    const checkoutUrl = `${window.location.origin}/billing/checkout-success?plan=${plan}&session_id=cs_test_mock`;
    return checkoutUrl;
  }
}

export const billingService = new BillingService();
export type { SubscriptionPlan, UsageStats, SubscriptionInfo };