import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDialog } from '../contexts/DialogContext';
import { useToast } from '../contexts/ToastContext';
import { getAllQuotaStatus, resetQuota } from '../utils/quotaManager';
import { useApiKeys } from '../contexts/ApiKeyContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/axios';
import './SettingsPage.css';

const SettingsPage = () => {
    const navigate = useNavigate();
    const { refetchApiKeys } = useApiKeys();
    const { user, logout } = useAuth();
    const { showConfirm } = useDialog();
    const { showToast, showErrorToast } = useToast();
    const [apiKeysStatus, setApiKeysStatus] = useState({
        youtubeApiKey: false,
        rapidApiKey: false
    });
    const [quotaStatus, setQuotaStatus] = useState({});

    useEffect(() => {
        // Fetch API keys status
        const fetchApiKeysStatus = async () => {
            try {
                const response = await api.get('/api/keys/status');
                setApiKeysStatus(response.data);
            } catch (error) {
                console.error('[Settings] Failed to fetch API keys status:', error);
            }
        };

        fetchApiKeysStatus();
        setQuotaStatus(getAllQuotaStatus());
    }, []);
    
    const refreshQuotaStatus = () => {
        setQuotaStatus(getAllQuotaStatus());
    };
    
    const handleResetQuota = async (platform) => {
        const confirmed = await showConfirm(
            `Are you sure you want to reset the ${platform.toUpperCase()} API quota tracking? This is for testing purposes only.`,
            'RESET QUOTA',
            'CANCEL'
        );

        if (confirmed) {
            resetQuota(platform);
            refreshQuotaStatus();
            showToast(`${platform.toUpperCase()} quota tracking reset successfully`, 'success');
        }
    };

    const handleLogout = async () => {
        const confirmed = await showConfirm(
            'Are you sure you want to logout?',
            'LOGOUT',
            'CANCEL'
        );

        if (confirmed) {
            await logout();
            showToast('Logged out successfully', 'success');
            navigate('/login');
        }
    };

    const handleRefreshKeys = async () => {
        try {
            const result = await refetchApiKeys();
            if (result.success) {
                showToast('API keys refreshed successfully', 'success');

                // Refresh status
                const response = await api.get('/api/keys/status');
                setApiKeysStatus(response.data);
            } else {
                showErrorToast('Failed to refresh API keys');
            }
        } catch (error) {
            showErrorToast('Failed to refresh API keys');
        }
    };

    return (
        <div className="platform-page">
            <div className="settings-grid">
                    <div className="settings-left-column">
                        {/* User Profile Section */}
                        <div className="settings-section">
                            <h3 className="section-subtitle">User Profile</h3>
                            <p className="section-description">
                                Your account information and actions.
                            </p>

                            <div className="form-group">
                                <label>Email</label>
                                <input
                                    type="text"
                                    value={user?.email || ''}
                                    disabled
                                    style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="button-group-compact">
                                <button onClick={handleLogout} className="aurora-btn aurora-btn-danger aurora-btn-sm">
                                    Logout
                                </button>
                            </div>
                        </div>

                        {/* API Keys Status Section */}
                        <div className="settings-section">
                            <h3 className="section-subtitle">API Keys Status</h3>
                            <p className="section-description">
                                Team-shared API keys are managed by administrators.
                            </p>

                            <div className="api-keys-status">
                                <div className="api-key-status-item">
                                    <span className="api-key-label">YouTube API Key:</span>
                                    <span className={`api-key-badge ${apiKeysStatus.youtubeApiKey ? 'configured' : 'not-configured'}`}>
                                        {apiKeysStatus.youtubeApiKey ? '✓ Configured' : '✗ Not Configured'}
                                    </span>
                                </div>
                                <div className="api-key-status-item">
                                    <span className="api-key-label">RapidAPI Key:</span>
                                    <span className={`api-key-badge ${apiKeysStatus.rapidApiKey ? 'configured' : 'not-configured'}`}>
                                        {apiKeysStatus.rapidApiKey ? '✓ Configured' : '✗ Not Configured'}
                                    </span>
                                </div>
                            </div>

                            <div className="button-group-compact">
                                <button onClick={handleRefreshKeys} className="aurora-btn aurora-btn-secondary aurora-btn-sm">
                                    Refresh Keys
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="settings-right-column">
                        <div className="settings-section">
                            <h3 className="section-subtitle">API Usage & Quotas</h3>
                            <p className="section-description">
                                Monitor your API usage across all platforms. Quotas reset automatically.
                            </p>
                            
                            <div className="quota-dashboard">
                                {Object.entries(quotaStatus).map(([platform, status]) => (
                                    <div key={platform} className="quota-card">
                                        <div className="quota-card-header">
                                            <h4 className="quota-platform-name">
                                                {platform === 'youtube' ? 'YouTube' : 
                                                 platform === 'tiktok' ? 'TikTok' : 
                                                 platform === 'instagram' ? 'Instagram' : platform}
                                            </h4>
                                            <span className="quota-period">
                                                {status.period === 'daily' ? 'Daily' : 'Monthly'}
                                            </span>
                                        </div>
                                        
                                        <div className="quota-stats">
                                            <div className="quota-stat">
                                                <span className="quota-stat-label">Used</span>
                                                <span className="quota-stat-value">{status.used.toLocaleString()}</span>
                                            </div>
                                            <div className="quota-stat">
                                                <span className="quota-stat-label">Remaining</span>
                                                <span className="quota-stat-value">{status.remaining.toLocaleString()}</span>
                                            </div>
                                            <div className="quota-stat">
                                                <span className="quota-stat-label">Total</span>
                                                <span className="quota-stat-value">{status.total.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="quota-progress">
                                            <div className="quota-progress-bar">
                                                <div 
                                                    className={`quota-progress-fill ${
                                                        status.percentage > 90 ? 'quota-critical' : 
                                                        status.percentage > 70 ? 'quota-warning' : 'quota-healthy'
                                                    }`}
                                                    style={{ 
                                                        width: `${status.percentage}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="quota-percentage">{status.percentage}%</span>
                                        </div>
                                        
                                        <div className="quota-card-actions">
                                            <button 
                                                onClick={() => handleResetQuota(platform)} 
                                                className="aurora-btn aurora-btn-danger aurora-btn-sm"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="quota-global-actions">
                                <button onClick={refreshQuotaStatus} className="aurora-btn aurora-btn-surface">
                                    Refresh All Status
                                </button>
                            </div>
                        </div>
                    </div>
            </div>
        </div>
    );
};

export default SettingsPage;