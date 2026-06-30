import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, Link, Users, Globe, Lock, Eye, Edit3, Mail } from 'lucide-react';
import axios from 'axios';

interface SharePanelProps {
  dashboardId: string;
  dashboardName: string;
  onClose: () => void;
}

interface ShareSettings {
  visibility: 'private' | 'public' | 'restricted';
  allowEditing: boolean;
  expiresAt: string | null;
  password: string | null;
  sharedWith: string[];
}

const SharePanel: React.FC<SharePanelProps> = ({ dashboardId, dashboardName, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    visibility: 'private',
    allowEditing: false,
    expiresAt: null,
    password: null,
    sharedWith: []
  });
  const [emailInput, setEmailInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    generateShareUrl();
  }, [dashboardId, shareSettings]);

  const generateShareUrl = async () => {
    setLoading(true);
    try {
      // Generate unique share ID
      const shareId = btoa(`${dashboardId}-${Date.now()}`).replace(/[^a-zA-Z0-9]/g, '').substring(0, 12);
      
      // Save share settings to backend
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboard/share`, {
        dashboard_id: dashboardId,
        share_id: shareId,
        settings: shareSettings
      });

      // Generate URL based on settings
      const baseUrl = window.location.origin;
      const params = new URLSearchParams();
      
      if (shareSettings.visibility === 'public') {
        setShareUrl(`${baseUrl}/public/dashboard/${shareId}`);
      } else {
        params.append('token', shareId);
        if (shareSettings.allowEditing) params.append('edit', 'true');
        setShareUrl(`${baseUrl}/app/shared/${dashboardId}?${params.toString()}`);
      }

      // Store in localStorage as fallback
      const shareData = {
        dashboardId,
        shareId,
        settings: shareSettings,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem(`share-${shareId}`, JSON.stringify(shareData));
    } catch (error) {
      console.error('Failed to generate share URL:', error);
      // Fallback to local generation
      const shareId = `local-${Date.now()}`;
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/app/preview/${dashboardId}?share=${shareId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddEmail = () => {
    if (emailInput && emailInput.includes('@')) {
      setShareSettings({
        ...shareSettings,
        sharedWith: [...shareSettings.sharedWith, emailInput]
      });
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setShareSettings({
      ...shareSettings,
      sharedWith: shareSettings.sharedWith.filter(e => e !== email)
    });
  };

  const handleSendInvites = async () => {
    if (shareSettings.sharedWith.length === 0) return;
    
    try {
      await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/v1/dashboard/invite`, {
        dashboard_id: dashboardId,
        dashboard_name: dashboardName,
        share_url: shareUrl,
        emails: shareSettings.sharedWith,
        message: `You've been invited to view the dashboard: ${dashboardName}`,
        permissions: shareSettings.allowEditing ? 'edit' : 'view'
      });
      
      alert('Invitations sent successfully!');
    } catch (error) {
      console.error('Failed to send invitations:', error);
      alert('Failed to send invitations. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
      <div 
        className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Share2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-bold text-white">Share Dashboard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Share URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Share Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white text-sm font-mono"
              />
              <button
                onClick={handleCopyUrl}
                className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Visibility Settings */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Visibility
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setShareSettings({ ...shareSettings, visibility: 'private' })}
                className={`p-3 rounded-lg border transition-all ${
                  shareSettings.visibility === 'private'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Lock className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs">Private</div>
              </button>
              <button
                onClick={() => setShareSettings({ ...shareSettings, visibility: 'restricted' })}
                className={`p-3 rounded-lg border transition-all ${
                  shareSettings.visibility === 'restricted'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Users className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs">Restricted</div>
              </button>
              <button
                onClick={() => setShareSettings({ ...shareSettings, visibility: 'public' })}
                className={`p-3 rounded-lg border transition-all ${
                  shareSettings.visibility === 'public'
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                    : 'bg-slate-900/50 border-white/10 text-slate-400 hover:border-white/20'
                }`}
              >
                <Globe className="w-5 h-5 mx-auto mb-1" />
                <div className="text-xs">Public</div>
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Permissions
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!shareSettings.allowEditing}
                  onChange={(e) => setShareSettings({ ...shareSettings, allowEditing: !e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500"
                />
                <Eye className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">View only</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareSettings.allowEditing}
                  onChange={(e) => setShareSettings({ ...shareSettings, allowEditing: e.target.checked })}
                  className="w-4 h-4 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500"
                />
                <Edit3 className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-400">Can edit</span>
              </label>
            </div>
          </div>

          {/* Share with specific people */}
          {shareSettings.visibility === 'restricted' && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                <Mail className="w-4 h-4 inline mr-2" />
                Share with specific people
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  placeholder="Enter email address..."
                  className="flex-1 px-4 py-2 bg-slate-900/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                />
                <button
                  onClick={handleAddEmail}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {shareSettings.sharedWith.map(email => (
                  <div key={email} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                    <span className="text-sm text-slate-300">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="p-1 hover:bg-red-500/20 rounded transition-colors"
                    >
                      <X className="w-3 h-3 text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              {showAdvanced ? 'Hide' : 'Show'} advanced settings
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 p-4 bg-slate-900/30 rounded-lg">
                {/* Expiration */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Link expires on
                  </label>
                  <input
                    type="datetime-local"
                    value={shareSettings.expiresAt || ''}
                    onChange={(e) => setShareSettings({ ...shareSettings, expiresAt: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded text-white text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>

                {/* Password Protection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    Password protection (optional)
                  </label>
                  <input
                    type="password"
                    value={shareSettings.password || ''}
                    onChange={(e) => setShareSettings({ ...shareSettings, password: e.target.value })}
                    placeholder="Enter password..."
                    className="w-full px-3 py-1.5 bg-slate-900/50 border border-white/10 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="px-6 py-2 text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-3">
            {shareSettings.sharedWith.length > 0 && (
              <button
                onClick={handleSendInvites}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Send Invites
              </button>
            )}
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharePanel;