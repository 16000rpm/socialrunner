import React, { useState, useEffect } from 'react';
import { useToast } from '../contexts/ToastContext';
import './FacebookAdsPage.css';

const BACKEND_URL = import.meta.env.PROD
    ? 'https://social-runner-api.onrender.com'
    : 'http://localhost:5000';

const FacebookAdsPage = () => {
    const { showToast, showErrorToast } = useToast();
    const [isConfigured, setIsConfigured] = useState(false);
    const [loading, setLoading] = useState(false);
    const [campaigns, setCampaigns] = useState([]);
    const [selectedCampaign, setSelectedCampaign] = useState('');
    const [dateRange, setDateRange] = useState('last_7d');
    const [adData, setAdData] = useState([]);
    const [chatgptExport, setChatgptExport] = useState('');
    const [showExport, setShowExport] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/facebook/status`);
            const data = await res.json();
            setIsConfigured(data.configured);
            if (data.configured) {
                loadCampaigns();
            }
        } catch (error) {
            console.error('Failed to check Facebook status:', error);
        }
    };

    const loadCampaigns = async () => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/facebook/campaigns`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setCampaigns(data.data || []);
        } catch (error) {
            showErrorToast('Failed to load campaigns: ' + error.message);
        }
    };

    const fetchAdPerformance = async () => {
        setLoading(true);
        try {
            let url = `${BACKEND_URL}/api/facebook/ads/export?datePreset=${dateRange}`;
            if (selectedCampaign) {
                url += `&campaignId=${selectedCampaign}`;
            }

            const res = await fetch(url);
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            setAdData(data.data || []);
            setChatgptExport(data.chatgptFormat || '');
            showToast(`Loaded ${data.data?.length || 0} ads`, 'success');
        } catch (error) {
            showErrorToast('Failed to fetch ad data: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(chatgptExport);
        showToast('Copied to clipboard! Paste into ChatGPT iteration prompt.', 'success');
    };

    if (!isConfigured) {
        return (
            <div className="platform-page">
                <div className="fb-not-configured">
                    <h2>Facebook Ads Not Configured</h2>
                    <p>To use Facebook Ads integration, add your credentials to the backend:</p>
                    <ol>
                        <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer">developers.facebook.com/apps</a></li>
                        <li>Create app (Business type) and add "Marketing API"</li>
                        <li>Generate User Access Token with <code>ads_read</code> scope</li>
                        <li>Get Ad Account ID from Ads Manager URL (act_XXXXXXXXX)</li>
                        <li>Edit <code>backend/src/services/facebookAdsService.js</code></li>
                        <li>Replace <code>YOUR_ACCESS_TOKEN_HERE</code> and <code>YOUR_AD_ACCOUNT_ID_HERE</code></li>
                        <li>Deploy and refresh this page</li>
                    </ol>
                </div>
            </div>
        );
    }

    return (
        <div className="platform-page">
            <div className="fb-controls">
                <div className="fb-filters">
                    <div className="fb-filter-group">
                        <label>Campaign</label>
                        <select
                            value={selectedCampaign}
                            onChange={(e) => setSelectedCampaign(e.target.value)}
                        >
                            <option value="">All Campaigns</option>
                            {campaigns.map(c => (
                                <option key={c.id} value={c.id}>
                                    {c.name} ({c.status})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="fb-filter-group">
                        <label>Date Range</label>
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="last_3d">Last 3 Days</option>
                            <option value="last_7d">Last 7 Days</option>
                            <option value="last_14d">Last 14 Days</option>
                            <option value="last_30d">Last 30 Days</option>
                        </select>
                    </div>

                    <button
                        onClick={fetchAdPerformance}
                        className="aurora-btn aurora-btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : 'Fetch Performance'}
                    </button>
                </div>
            </div>

            {adData.length > 0 && (
                <>
                    <div className="fb-summary">
                        <div className="fb-summary-stat">
                            <span className="label">Total Ads</span>
                            <span className="value">{adData.length}</span>
                        </div>
                        <div className="fb-summary-stat">
                            <span className="label">Total Spend</span>
                            <span className="value">${adData.reduce((sum, a) => sum + parseFloat(a.spend), 0).toFixed(2)}</span>
                        </div>
                        <div className="fb-summary-stat">
                            <span className="label">Total Installs</span>
                            <span className="value">{adData.reduce((sum, a) => sum + a.installs, 0)}</span>
                        </div>
                        <div className="fb-summary-stat">
                            <span className="label">Avg CPI</span>
                            <span className="value">
                                ${(adData.reduce((sum, a) => sum + parseFloat(a.spend), 0) /
                                   Math.max(1, adData.reduce((sum, a) => sum + a.installs, 0))).toFixed(2)}
                            </span>
                        </div>
                    </div>

                    <div className="fb-table-container">
                        <table className="fb-table">
                            <thead>
                                <tr>
                                    <th>Ad Name (Hook)</th>
                                    <th>Campaign</th>
                                    <th>Spend</th>
                                    <th>Installs</th>
                                    <th>CPI</th>
                                    <th>CTR</th>
                                    <th>Retention</th>
                                </tr>
                            </thead>
                            <tbody>
                                {adData.sort((a, b) => {
                                    if (!a.cpi) return 1;
                                    if (!b.cpi) return -1;
                                    return parseFloat(a.cpi) - parseFloat(b.cpi);
                                }).map((ad, i) => (
                                    <tr key={i} className={
                                        ad.cpi && parseFloat(ad.cpi) < 1 ? 'row-winner' :
                                        ad.cpi && parseFloat(ad.cpi) > 3 ? 'row-loser' : ''
                                    }>
                                        <td className="ad-name">{ad.adName}</td>
                                        <td>{ad.campaignName}</td>
                                        <td>${ad.spend}</td>
                                        <td>{ad.installs}</td>
                                        <td className="cpi-cell">
                                            {ad.cpi ? `$${ad.cpi}` : '-'}
                                        </td>
                                        <td>{ad.ctr}%</td>
                                        <td>
                                            {ad.videoMetrics ? (
                                                <span className="retention-mini">
                                                    25%: {ad.videoMetrics.retention25}% |
                                                    50%: {ad.videoMetrics.retention50}%
                                                </span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="fb-export-section">
                        <button
                            onClick={() => setShowExport(!showExport)}
                            className="aurora-btn aurora-btn-secondary"
                        >
                            {showExport ? 'Hide' : 'Show'} ChatGPT Export
                        </button>

                        {showExport && (
                            <div className="fb-export-box">
                                <div className="export-header">
                                    <span>Copy this into the Hook Engine Iteration Prompt:</span>
                                    <button onClick={copyToClipboard} className="aurora-btn aurora-btn-sm aurora-btn-primary">
                                        Copy
                                    </button>
                                </div>
                                <pre>{chatgptExport}</pre>
                            </div>
                        )}
                    </div>
                </>
            )}

            {adData.length === 0 && !loading && (
                <div className="fb-empty">
                    <p>Select filters and click "Fetch Performance" to load ad data</p>
                </div>
            )}
        </div>
    );
};

export default FacebookAdsPage;
