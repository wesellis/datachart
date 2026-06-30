// DataChart SaaS - Customer Onboarding Component
// Complete onboarding flow for new enterprise customers

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRightIcon,
  ChevronLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CloudIcon,
  CircleStackIcon,
  CogIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  component: React.ComponentType<any>;
  required: boolean;
  completed: boolean;
}

interface IntegrationCredentials {
  snowflake?: {
    account: string;
    username: string;
    password: string;
    warehouse: string;
    database: string;
    role?: string;
  };
  azure?: {
    tenant_id: string;
    client_id: string;
    client_secret: string;
    subscription_id: string;
  };
  servicenow?: {
    instance: string;
    username: string;
    password: string;
    api_version?: string;
  };
}

interface OnboardingData {
  company_info: {
    name: string;
    industry: string;
    size: string;
    use_case: string;
    timezone: string;
  };
  integrations: IntegrationCredentials;
  preferences: {
    dashboard_layout: string;
    notification_frequency: string;
    alert_threshold: string;
    data_retention: string;
  };
  team_members: {
    name: string;
    email: string;
    role: string;
  }[];
}

const CustomerOnboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    company_info: {
      name: '',
      industry: '',
      size: '',
      use_case: '',
      timezone: 'UTC'
    },
    integrations: {},
    preferences: {
      dashboard_layout: 'executive',
      notification_frequency: 'daily',
      alert_threshold: 'medium',
      data_retention: '90d'
    },
    team_members: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to DataChart',
      description: 'Let\'s get your APM platform set up in just a few minutes',
      icon: UserGroupIcon,
      component: WelcomeStep,
      required: true,
      completed: false
    },
    {
      id: 'company_info',
      title: 'Company Information',
      description: 'Tell us about your organization',
      icon: CogIcon,
      component: CompanyInfoStep,
      required: true,
      completed: false
    },
    {
      id: 'snowflake_integration',
      title: 'Snowflake Integration',
      description: 'Connect your primary data warehouse',
      icon: CircleStackIcon,
      component: SnowflakeIntegrationStep,
      required: true,
      completed: false
    },
    {
      id: 'azure_integration',
      title: 'Azure Integration',
      description: 'Connect Azure Cost Management and resources',
      icon: CloudIcon,
      component: AzureIntegrationStep,
      required: false,
      completed: false
    },
    {
      id: 'servicenow_integration',
      title: 'ServiceNow Integration',
      description: 'Connect ITSM and incident data',
      icon: ShieldCheckIcon,
      component: ServiceNowIntegrationStep,
      required: false,
      completed: false
    },
    {
      id: 'preferences',
      title: 'Dashboard Preferences',
      description: 'Customize your dashboard and alerts',
      icon: ChartBarIcon,
      component: PreferencesStep,
      required: true,
      completed: false
    },
    {
      id: 'team_setup',
      title: 'Team Members',
      description: 'Invite your team members',
      icon: UserGroupIcon,
      component: TeamSetupStep,
      required: false,
      completed: false
    },
    {
      id: 'complete',
      title: 'Setup Complete',
      description: 'You\'re ready to start monitoring!',
      icon: CheckCircleIcon,
      component: CompletionStep,
      required: true,
      completed: false
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateOnboardingData = (stepId: string, data: any) => {
    setOnboardingData(prev => ({
      ...prev,
      [stepId]: { ...prev[stepId as keyof OnboardingData], ...data }
    }));
  };

  const completeStep = (stepId: string) => {
    steps.find(step => step.id === stepId)!.completed = true;
  };

  const saveOnboardingProgress = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/onboarding/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          current_step: currentStep,
          data: onboardingData,
          completed_steps: steps.filter(s => s.completed).map(s => s.id)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }
    } catch (error) {
      console.error('Error saving onboarding progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    saveOnboardingProgress();
  }, [currentStep, onboardingData]);

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Setup Your DataChart Platform
            </h1>
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <step.icon className="w-4 h-4" />
                {step.completed && (
                  <CheckCircleIcon className="w-4 h-4 text-green-500 ml-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            {React.createElement(steps[currentStep].icon, { className: "w-8 h-8 text-blue-600 mr-3" })}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {steps[currentStep].title}
              </h2>
              <p className="text-gray-600 mt-1">
                {steps[currentStep].description}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentStepComponent
                data={onboardingData}
                updateData={updateOnboardingData}
                onComplete={() => completeStep(steps[currentStep].id)}
                onNext={nextStep}
              />
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </button>

            {errors.length > 0 && (
              <div className="flex items-center text-red-600 mx-4">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                <span className="text-sm">Please fix errors to continue</span>
              </div>
            )}

            <button
              onClick={nextStep}
              disabled={currentStep === steps.length - 1 || isLoading}
              className={`flex items-center px-6 py-2 rounded-lg font-medium transition-colors ${
                currentStep === steps.length - 1
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
              }`}
            >
              {isLoading ? 'Saving...' : 'Continue'}
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Step Component
const WelcomeStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ onComplete, onNext }) => {
  useEffect(() => {
    onComplete();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="mb-8">
        <div className="mx-auto w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <ChartBarIcon className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome to DataChart SaaS
        </h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Transform your enterprise monitoring with our comprehensive APM platform. 
          We'll help you connect your data sources, configure dashboards, and set up 
          your team for success.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 bg-blue-50 rounded-lg">
          <CircleStackIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 mb-2">Connect Data Sources</h4>
          <p className="text-sm text-gray-600">
            Integrate Snowflake, Azure, ServiceNow, and more
          </p>
        </div>
        <div className="p-4 bg-green-50 rounded-lg">
          <ChartBarIcon className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 mb-2">Custom Dashboards</h4>
          <p className="text-sm text-gray-600">
            Professional dashboards tailored to your needs
          </p>
        </div>
        <div className="p-4 bg-purple-50 rounded-lg">
          <UserGroupIcon className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <h4 className="font-semibold text-gray-900 mb-2">Team Collaboration</h4>
          <p className="text-sm text-gray-600">
            Invite team members and set up roles
          </p>
        </div>
      </div>

      <button
        onClick={onNext}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
      >
        Get Started
      </button>
    </div>
  );
};

// Company Info Step Component
const CompanyInfoStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ data, updateData, onComplete }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            required
            value={data.company_info.name}
            onChange={(e) => updateData('company_info', { name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Acme Corporation"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry *
          </label>
          <select
            required
            value={data.company_info.industry}
            onChange={(e) => updateData('company_info', { industry: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Industry</option>
            <option value="technology">Technology</option>
            <option value="financial_services">Financial Services</option>
            <option value="healthcare">Healthcare</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="retail">Retail</option>
            <option value="government">Government</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size *
          </label>
          <select
            required
            value={data.company_info.size}
            onChange={(e) => updateData('company_info', { size: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Size</option>
            <option value="startup">Startup (1-50 employees)</option>
            <option value="small">Small (51-200 employees)</option>
            <option value="medium">Medium (201-1000 employees)</option>
            <option value="large">Large (1000+ employees)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timezone *
          </label>
          <select
            required
            value={data.company_info.timezone}
            onChange={(e) => updateData('company_info', { timezone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Berlin">Berlin</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Use Case *
        </label>
        <textarea
          required
          value={data.company_info.use_case}
          onChange={(e) => updateData('company_info', { use_case: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          rows={4}
          placeholder="Describe how you plan to use DataChart (e.g., monitoring production systems, cost optimization, incident management)"
        />
      </div>
    </form>
  );
};

// Snowflake Integration Step Component
const SnowflakeIntegrationStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ data, updateData, onComplete }) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/v1/integrations/snowflake/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(data.integrations.snowflake)
      });

      if (response.ok) {
        setConnectionStatus('success');
        onComplete();
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center">
          <CircleStackIcon className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-blue-900">Snowflake Connection</span>
        </div>
        <p className="text-blue-700 mt-1 text-sm">
          Connect your Snowflake data warehouse to access monitoring and performance data
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Account Identifier *
          </label>
          <input
            type="text"
            required
            value={data.integrations.snowflake?.account || ''}
            onChange={(e) => updateData('integrations', { 
              snowflake: { ...data.integrations.snowflake, account: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="abc12345.us-east-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          <input
            type="text"
            required
            value={data.integrations.snowflake?.username || ''}
            onChange={(e) => updateData('integrations', { 
              snowflake: { ...data.integrations.snowflake, username: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="your_username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            required
            value={data.integrations.snowflake?.password || ''}
            onChange={(e) => updateData('integrations', { 
              snowflake: { ...data.integrations.snowflake, password: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="your_password"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Warehouse *
          </label>
          <input
            type="text"
            required
            value={data.integrations.snowflake?.warehouse || ''}
            onChange={(e) => updateData('integrations', { 
              snowflake: { ...data.integrations.snowflake, warehouse: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="COMPUTE_WH"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Database *
          </label>
          <input
            type="text"
            required
            value={data.integrations.snowflake?.database || ''}
            onChange={(e) => updateData('integrations', { 
              snowflake: { ...data.integrations.snowflake, database: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="MONITORING"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role (Optional)
          </label>
          <input
            type="text"
            value={data.integrations.snowflake?.role || ''}
            onChange={(e) => updateData('integrations', { 
              snowflake: { ...data.integrations.snowflake, role: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="ACCOUNTADMIN"
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={testConnection}
          disabled={isTestingConnection}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isTestingConnection ? 'Testing...' : 'Test Connection'}
        </button>

        {connectionStatus === 'success' && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-900">Connection Successful</span>
            </div>
            <p className="text-green-700 text-sm mt-1">
              Successfully connected to Snowflake. Your credentials will be encrypted and stored securely.
            </p>
          </div>
        )}

        {connectionStatus === 'error' && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-medium text-red-900">Connection Failed</span>
            </div>
            <p className="text-red-700 text-sm mt-1">
              Unable to connect to Snowflake. Please check your credentials and try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Azure Integration Step Component
const AzureIntegrationStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ data, updateData, onComplete }) => {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const testConnection = async () => {
    setIsTestingConnection(true);
    try {
      const response = await fetch('/api/v1/integrations/azure/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify(data.integrations.azure)
      });

      if (response.ok) {
        setConnectionStatus('success');
        onComplete();
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const skipStep = () => {
    onComplete();
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CloudIcon className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">Azure Integration (Optional)</span>
          </div>
          <button
            onClick={skipStep}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Skip for now
          </button>
        </div>
        <p className="text-blue-700 mt-1 text-sm">
          Connect Azure to monitor costs, resources, and Intune device management
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tenant ID
          </label>
          <input
            type="text"
            value={data.integrations.azure?.tenant_id || ''}
            onChange={(e) => updateData('integrations', { 
              azure: { ...data.integrations.azure, tenant_id: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="12345678-1234-1234-1234-123456789012"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client ID
          </label>
          <input
            type="text"
            value={data.integrations.azure?.client_id || ''}
            onChange={(e) => updateData('integrations', { 
              azure: { ...data.integrations.azure, client_id: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="12345678-1234-1234-1234-123456789012"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Client Secret
          </label>
          <input
            type="password"
            value={data.integrations.azure?.client_secret || ''}
            onChange={(e) => updateData('integrations', { 
              azure: { ...data.integrations.azure, client_secret: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="your_client_secret"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subscription ID
          </label>
          <input
            type="text"
            value={data.integrations.azure?.subscription_id || ''}
            onChange={(e) => updateData('integrations', { 
              azure: { ...data.integrations.azure, subscription_id: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="12345678-1234-1234-1234-123456789012"
          />
        </div>
      </div>

      {Object.values(data.integrations.azure || {}).some(val => val) && (
        <div className="mt-6">
          <button
            onClick={testConnection}
            disabled={isTestingConnection}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {isTestingConnection ? 'Testing...' : 'Test Connection'}
          </button>

          {connectionStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <span className="font-medium text-green-900">Azure Connected Successfully</span>
              </div>
            </div>
          )}

          {connectionStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
                <span className="font-medium text-red-900">Azure Connection Failed</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ServiceNow Integration Step Component (similar structure to Azure)
const ServiceNowIntegrationStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ data, updateData, onComplete }) => {
  const skipStep = () => {
    onComplete();
  };

  return (
    <div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium text-blue-900">ServiceNow Integration (Optional)</span>
          </div>
          <button
            onClick={skipStep}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Skip for now
          </button>
        </div>
        <p className="text-blue-700 mt-1 text-sm">
          Connect ServiceNow for incident management and ITSM data
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Instance URL
          </label>
          <input
            type="text"
            value={data.integrations.servicenow?.instance || ''}
            onChange={(e) => updateData('integrations', { 
              servicenow: { ...data.integrations.servicenow, instance: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="your-instance.service-now.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <input
            type="text"
            value={data.integrations.servicenow?.username || ''}
            onChange={(e) => updateData('integrations', { 
              servicenow: { ...data.integrations.servicenow, username: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="your_username"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <input
            type="password"
            value={data.integrations.servicenow?.password || ''}
            onChange={(e) => updateData('integrations', { 
              servicenow: { ...data.integrations.servicenow, password: e.target.value }
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="your_password"
          />
        </div>
      </div>
    </div>
  );
};

// Preferences Step Component
const PreferencesStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ data, updateData, onComplete }) => {
  useEffect(() => {
    onComplete();
  }, [data.preferences]);

  return (
    <div>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dashboard Layout
          </label>
          <select
            value={data.preferences.dashboard_layout}
            onChange={(e) => updateData('preferences', { dashboard_layout: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="executive">Executive Summary</option>
            <option value="technical">Technical Details</option>
            <option value="mixed">Mixed View</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notification Frequency
          </label>
          <select
            value={data.preferences.notification_frequency}
            onChange={(e) => updateData('preferences', { notification_frequency: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="realtime">Real-time</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alert Threshold
          </label>
          <select
            value={data.preferences.alert_threshold}
            onChange={(e) => updateData('preferences', { alert_threshold: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="low">Low (More alerts)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="high">High (Fewer alerts)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data Retention
          </label>
          <select
            value={data.preferences.data_retention}
            onChange={(e) => updateData('preferences', { data_retention: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="180d">180 Days</option>
            <option value="1y">1 Year</option>
          </select>
        </div>
      </div>
    </div>
  );
};

// Team Setup Step Component
const TeamSetupStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ data, updateData, onComplete }) => {
  const [newMember, setNewMember] = useState({ name: '', email: '', role: 'viewer' });

  const addTeamMember = () => {
    if (newMember.name && newMember.email) {
      updateData('team_members', [...data.team_members, newMember]);
      setNewMember({ name: '', email: '', role: 'viewer' });
    }
  };

  const removeMember = (index: number) => {
    const updated = data.team_members.filter((_, i) => i !== index);
    updateData('team_members', updated);
  };

  useEffect(() => {
    onComplete();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Add Team Members</h4>
        <div className="grid md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Name"
            value={newMember.name}
            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            value={newMember.email}
            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            value={newMember.role}
            onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="viewer">Viewer</option>
            <option value="analyst">Analyst</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={addTeamMember}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add
          </button>
        </div>
      </div>

      {data.team_members.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-gray-900 mb-4">Team Members</h4>
          <div className="space-y-2">
            {data.team_members.map((member, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium text-gray-900">{member.name}</span>
                  <span className="text-gray-600 ml-2">({member.email})</span>
                  <span className="inline-block ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                    {member.role}
                  </span>
                </div>
                <button
                  onClick={() => removeMember(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Completion Step Component
const CompletionStep: React.FC<{
  data: OnboardingData;
  updateData: (stepId: string, data: any) => void;
  onComplete: () => void;
  onNext: () => void;
}> = ({ onComplete }) => {
  useEffect(() => {
    onComplete();
  }, []);

  return (
    <div className="text-center py-8">
      <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
        <CheckCircleIcon className="w-12 h-12 text-green-600" />
      </div>
      
      <h3 className="text-2xl font-bold text-gray-900 mb-4">
        Setup Complete!
      </h3>
      
      <p className="text-lg text-gray-600 mb-8">
        Your DataChart platform is ready. You can now access your dashboards and start monitoring your systems.
      </p>

      <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
        <a
          href="/dashboard"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          View Dashboard
        </a>
        <a
          href="/settings"
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Manage Settings
        </a>
      </div>
    </div>
  );
};

export default CustomerOnboarding;