import React, { useState, useEffect } from 'react';
import { billingService, SubscriptionPlan, UsageStats, SubscriptionInfo } from '../../services/billingService';

const BillingDashboard: React.FC = () => {
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({});
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionInfo | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansResult, subscriptionResult, usageResult] = await Promise.all([
        billingService.getPlans(),
        billingService.getSubscription(),
        billingService.getUsageStats()
      ]);

      setPlans(plansResult.plans);
      setCurrentSubscription(subscriptionResult);
      setUsageStats(usageResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setProcessingPlan(planId);
      setError(null);

      const checkoutSession = await billingService.createCheckoutSession({
        plan: planId,
        success_url: `${window.location.origin}/billing/success`,
        cancel_url: `${window.location.origin}/billing`
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutSession.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      setProcessingPlan(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setError(null);
      const portalSession = await billingService.createBillingPortal(
        `${window.location.origin}/billing`
      );
      
      // Redirect to Stripe Customer Portal
      window.location.href = portalSession.portal_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create billing portal session');
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm('Are you sure you want to cancel your subscription? Your subscription will remain active until the end of the current billing period.')) {
      return;
    }

    try {
      setError(null);
      await billingService.cancelSubscription(true);
      await loadBillingData();
      alert('Subscription has been scheduled for cancellation at the end of your current billing period.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing & Subscriptions</h1>
            <p className="text-gray-600 mt-2">Manage your subscription and billing settings</p>
          </div>
          {currentSubscription?.subscription && (
            <button
              onClick={handleManageBilling}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Manage Billing
            </button>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
            <button onClick={() => setError(null)} className="float-right font-bold">×</button>
          </div>
        )}

        {/* Current Plan Status */}
        {usageStats && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Current Plan: {usageStats.plan.charAt(0).toUpperCase() + usageStats.plan.slice(1)}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Users Usage */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageStats.current_usage.users} / {billingService.formatLimit(usageStats.limits.max_users)}
                </div>
                <div className="text-gray-600">Users</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      billingService.getUsageColor(usageStats.usage_percentage.users) === 'red' ? 'bg-red-500' :
                      billingService.getUsageColor(usageStats.usage_percentage.users) === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usageStats.usage_percentage.users, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Dashboards Usage */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageStats.current_usage.dashboards} / {billingService.formatLimit(usageStats.limits.max_dashboards)}
                </div>
                <div className="text-gray-600">Dashboards</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      billingService.getUsageColor(usageStats.usage_percentage.dashboards) === 'red' ? 'bg-red-500' :
                      billingService.getUsageColor(usageStats.usage_percentage.dashboards) === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usageStats.usage_percentage.dashboards, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Data Sources Usage */}
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {usageStats.current_usage.data_sources} / {billingService.formatLimit(usageStats.limits.max_data_sources)}
                </div>
                <div className="text-gray-600">Data Sources</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${
                      billingService.getUsageColor(usageStats.usage_percentage.data_sources) === 'red' ? 'bg-red-500' :
                      billingService.getUsageColor(usageStats.usage_percentage.data_sources) === 'yellow' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(usageStats.usage_percentage.data_sources, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            {currentSubscription?.subscription && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">Subscription Status: {currentSubscription.status}</div>
                    {currentSubscription.subscription.current_period_end && (
                      <div className="text-sm text-gray-600">
                        Next billing: {new Date(currentSubscription.subscription.current_period_end * 1000).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleCancelSubscription}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Cancel Subscription
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(plans).map(([planId, plan]) => (
            <div
              key={planId}
              className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${
                usageStats?.plan === planId ? 'border-blue-500' : 'border-transparent'
              }`}
            >
              <div className="p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                  <div className="text-3xl font-bold text-gray-900 mt-2">
                    {billingService.formatPlanPrice(plan)}
                  </div>
                  {usageStats?.plan === planId && (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mt-2">
                      Current Plan
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <span className="text-green-500 mr-2">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="text-xs text-gray-500 space-y-1 mb-6">
                  <div>Users: {billingService.formatLimit(plan.limits.max_users)}</div>
                  <div>Dashboards: {billingService.formatLimit(plan.limits.max_dashboards)}</div>
                  <div>Data Sources: {billingService.formatLimit(plan.limits.max_data_sources)}</div>
                </div>

                {/* Action Button */}
                <div className="text-center">
                  {usageStats?.plan === planId ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                    >
                      Current Plan
                    </button>
                  ) : planId === 'free' ? (
                    <button
                      disabled
                      className="w-full bg-gray-300 text-gray-500 py-2 px-4 rounded-lg cursor-not-allowed"
                    >
                      Downgrade via Support
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(planId)}
                      disabled={processingPlan === planId}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
                    >
                      {processingPlan === planId ? 'Processing...' : 
                       usageStats && plans[usageStats.plan] && plans[usageStats.plan].price < plan.price ? 'Upgrade' : 
                       'Change Plan'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Billing History */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Billing Information</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-600">
                  For detailed billing history, invoice downloads, and payment method management, 
                  use the billing portal.
                </p>
              </div>
              <button
                onClick={handleManageBilling}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                View Billing History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingDashboard;