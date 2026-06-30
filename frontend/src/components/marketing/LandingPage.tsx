import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header style={{ backgroundColor: '#1e293b', borderBottom: '1px solid #334155' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold" style={{ color: 'white' }}>DataChart</div>
            <nav className="flex items-center space-x-8">
              <a href="#features" style={{ color: '#94a3b8' }} className="hover:text-white">Features</a>
              <a href="#pricing" style={{ color: '#94a3b8' }} className="hover:text-white">Pricing</a>
              <a href="#about" style={{ color: '#94a3b8' }} className="hover:text-white">About</a>
              <Link to="/login" style={{ color: '#94a3b8' }} className="hover:text-white">Login</Link>
              <Link 
                to="/app/dashboard-builder" 
                style={{ 
                  backgroundColor: '#2563eb', 
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '6px'
                }}
                className="hover:opacity-90"
              >
                Get Started
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'white' }}>
            Enterprise APM Dashboard Platform
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto" style={{ color: '#94a3b8' }}>
            Build professional application portfolio management dashboards with live data integration.
            Connect to Snowflake, Azure, and ServiceNow for real-time insights.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/app/dashboard-builder" 
              style={{ 
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: '600',
                display: 'inline-block'
              }}
              className="hover:opacity-90"
            >
              Start Free Trial
            </Link>
            <Link 
              to="/login" 
              style={{ 
                border: '1px solid #475569',
                color: 'white',
                padding: '12px 32px',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: '600',
                display: 'inline-block'
              }}
              className="hover:opacity-90"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20" style={{ backgroundColor: '#1e293b' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'white' }}>Key Features</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div style={{ backgroundColor: '#0f172a', padding: '32px', borderRadius: '8px' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'white' }}>Live Data Integration</h3>
              <p style={{ color: '#94a3b8' }}>
                Connect directly to Snowflake, Azure APIs, and ServiceNow for real-time APM metrics
              </p>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '32px', borderRadius: '8px' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'white' }}>Drag & Drop Builder</h3>
              <p style={{ color: '#94a3b8' }}>
                Build sophisticated dashboards with our intuitive widget library and layout system
              </p>
            </div>
            <div style={{ backgroundColor: '#0f172a', padding: '32px', borderRadius: '8px' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'white' }}>Multi-Tenant SaaS</h3>
              <p style={{ color: '#94a3b8' }}>
                Enterprise-grade multi-tenant architecture with customer isolation and security
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20" style={{ backgroundColor: '#0f172a' }}>
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12" style={{ color: 'white' }}>Simple Pricing</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div style={{ border: '1px solid #334155', borderRadius: '8px', padding: '32px' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'white' }}>Starter</h3>
              <div className="text-3xl font-bold mb-4" style={{ color: 'white' }}>
                $99<span className="text-lg" style={{ color: '#94a3b8' }}>/mo</span>
              </div>
              <ul className="space-y-2" style={{ color: '#94a3b8' }}>
                <li>5 Dashboards</li>
                <li>10 Users</li>
                <li>Basic Support</li>
              </ul>
            </div>
            <div style={{ border: '1px solid #2563eb', borderRadius: '8px', padding: '32px', position: 'relative' }}>
              <span style={{ 
                position: 'absolute',
                top: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: '#2563eb',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px'
              }}>
                POPULAR
              </span>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'white' }}>Professional</h3>
              <div className="text-3xl font-bold mb-4" style={{ color: 'white' }}>
                $299<span className="text-lg" style={{ color: '#94a3b8' }}>/mo</span>
              </div>
              <ul className="space-y-2" style={{ color: '#94a3b8' }}>
                <li>Unlimited Dashboards</li>
                <li>50 Users</li>
                <li>Priority Support</li>
              </ul>
            </div>
            <div style={{ border: '1px solid #334155', borderRadius: '8px', padding: '32px' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'white' }}>Enterprise</h3>
              <div className="text-3xl font-bold mb-4" style={{ color: 'white' }}>Custom</div>
              <ul className="space-y-2" style={{ color: '#94a3b8' }}>
                <li>Custom Features</li>
                <li>Unlimited Users</li>
                <li>24/7 Support</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ borderTop: '1px solid #334155' }}>
        <div className="container mx-auto px-6 text-center" style={{ color: '#94a3b8' }}>
          <p>&copy; 2024 DataChart. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;