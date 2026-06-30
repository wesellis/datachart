import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogIn, Shield, User, Lock, AlertCircle } from 'lucide-react';
import './Login.css';

interface LoginProps {
  onSuccess?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const success = await login(email, password);
    
    if (success) {
      onSuccess?.();
    } else {
      setError('Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  const quickLogin = (role: string) => {
    switch(role) {
      case 'admin':
        setEmail('admin@DataChart.com');
        setPassword('demo123');
        break;
      case 'cfo':
        setEmail('cfo@DataChart.com');
        setPassword('demo123');
        break;
      case 'ciso':
        setEmail('ciso@DataChart.com');
        setPassword('demo123');
        break;
    }
  };

  return (
    <div className="login-container">
      <div className="login-background">
        <div className="grid-pattern"></div>
        <div className="floating-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
      </div>

      <div className="login-card">
        <div className="login-header">
          <div className="logo">
            <Shield size={40} className="logo-icon" />
            <div className="logo-text">
              <h1>DataChart APM</h1>
              <p>Application Portfolio Management</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <User size={16} />
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={16} />
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              <span className="loading">Signing in...</span>
            ) : (
              <>
                <LogIn size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="demo-section">
          <button 
            className="hint-toggle"
            onClick={() => setShowHint(!showHint)}
          >
            {showHint ? 'Hide' : 'Show'} Demo Credentials
          </button>

          {showHint && (
            <div className="demo-credentials">
              <h3>Quick Access</h3>
              <div className="demo-users">
                <div className="demo-user" onClick={() => quickLogin('admin')}>
                  <div className="user-role admin">CEO</div>
                  <div className="user-info">
                    <span className="user-email">admin@DataChart.com</span>
                    <span className="user-access">All Views</span>
                  </div>
                </div>
                <div className="demo-user" onClick={() => quickLogin('cfo')}>
                  <div className="user-role manager">CFO</div>
                  <div className="user-info">
                    <span className="user-email">cfo@DataChart.com</span>
                    <span className="user-access">Cost Optimization</span>
                  </div>
                </div>
                <div className="demo-user" onClick={() => quickLogin('ciso')}>
                  <div className="user-role analyst">CISO</div>
                  <div className="user-info">
                    <span className="user-email">ciso@DataChart.com</span>
                    <span className="user-access">Risk & Compliance</span>
                  </div>
                </div>
              </div>
              <p className="demo-note">Password for all: demo123</p>
              <p className="demo-note quick">Quick admin: admin/admin</p>
            </div>
          )}
        </div>

        <div className="login-footer">
          <p>Enterprise Application Portfolio Management System</p>
          <p className="version">v2.0.0 • Integration Hub Enabled</p>
        </div>
      </div>
    </div>
  );
};

export default Login;