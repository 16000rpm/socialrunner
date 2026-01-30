/**
 * Facebook Marketing API Service
 * Fetches ad performance data for CPI analysis
 */

const FACEBOOK_GRAPH_URL = 'https://graph.facebook.com/v18.0';

// Hardcoded credentials (replace with your own)
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';
const FB_AD_ACCOUNT_ID = process.env.FB_AD_ACCOUNT_ID || 'YOUR_AD_ACCOUNT_ID_HERE';

/**
 * Get campaigns with performance metrics
 * @param {Object} options - Query options
 * @param {string} options.datePreset - Date range (today, yesterday, last_7d, last_14d, last_30d)
 * @param {string} options.startDate - Custom start date (YYYY-MM-DD)
 * @param {string} options.endDate - Custom end date (YYYY-MM-DD)
 * @returns {Promise<Array>} Campaign performance data
 */
async function getCampaignPerformance(options = {}) {
    const { datePreset = 'last_7d', startDate, endDate } = options;

    let timeRange = '';
    if (startDate && endDate) {
        timeRange = `&time_range={"since":"${startDate}","until":"${endDate}"}`;
    } else {
        timeRange = `&date_preset=${datePreset}`;
    }

    const fields = 'campaign_name,spend,impressions,clicks,actions,cost_per_action_type';
    const url = `${FACEBOOK_GRAPH_URL}/act_${FB_AD_ACCOUNT_ID}/insights?fields=${fields}&level=campaign${timeRange}&access_token=${FB_ACCESS_TOKEN}`;

    console.log('[Facebook Ads] Fetching campaign performance...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error('[Facebook Ads] API Error:', data.error);
        throw new Error(data.error.message || 'Facebook API error');
    }

    return parseCampaignData(data.data || []);
}

/**
 * Get ad-level performance (for hook analysis)
 * @param {Object} options - Query options
 * @param {string} options.campaignId - Filter by campaign ID
 * @param {string} options.datePreset - Date range
 * @param {string} options.startDate - Custom start date
 * @param {string} options.endDate - Custom end date
 * @returns {Promise<Array>} Ad performance data
 */
async function getAdPerformance(options = {}) {
    const { campaignId, datePreset = 'last_7d', startDate, endDate } = options;

    let timeRange = '';
    if (startDate && endDate) {
        timeRange = `&time_range={"since":"${startDate}","until":"${endDate}"}`;
    } else {
        timeRange = `&date_preset=${datePreset}`;
    }

    let filtering = '';
    if (campaignId) {
        filtering = `&filtering=[{"field":"campaign.id","operator":"EQUAL","value":"${campaignId}"}]`;
    }

    const fields = 'ad_name,campaign_name,spend,impressions,clicks,actions,cost_per_action_type,video_play_actions,video_p25_watched_actions,video_p50_watched_actions,video_p75_watched_actions,video_p100_watched_actions';
    const url = `${FACEBOOK_GRAPH_URL}/act_${FB_AD_ACCOUNT_ID}/insights?fields=${fields}&level=ad${timeRange}${filtering}&access_token=${FB_ACCESS_TOKEN}`;

    console.log('[Facebook Ads] Fetching ad performance...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error('[Facebook Ads] API Error:', data.error);
        throw new Error(data.error.message || 'Facebook API error');
    }

    return parseAdData(data.data || []);
}

/**
 * Get all campaigns (for dropdown selection)
 * @returns {Promise<Array>} List of campaigns
 */
async function getCampaigns() {
    const fields = 'id,name,status,objective,created_time';
    const url = `${FACEBOOK_GRAPH_URL}/act_${FB_AD_ACCOUNT_ID}/campaigns?fields=${fields}&access_token=${FB_ACCESS_TOKEN}`;

    console.log('[Facebook Ads] Fetching campaigns list...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
        console.error('[Facebook Ads] API Error:', data.error);
        throw new Error(data.error.message || 'Facebook API error');
    }

    return data.data || [];
}

/**
 * Parse campaign data and extract CPI
 */
function parseCampaignData(campaigns) {
    return campaigns.map(campaign => {
        const installs = getActionValue(campaign.actions, 'mobile_app_install') ||
                        getActionValue(campaign.actions, 'app_install') ||
                        getActionValue(campaign.actions, 'omni_app_install');

        const cpi = getCostPerAction(campaign.cost_per_action_type, 'mobile_app_install') ||
                   getCostPerAction(campaign.cost_per_action_type, 'app_install') ||
                   getCostPerAction(campaign.cost_per_action_type, 'omni_app_install');

        return {
            name: campaign.campaign_name,
            spend: parseFloat(campaign.spend || 0).toFixed(2),
            impressions: parseInt(campaign.impressions || 0),
            clicks: parseInt(campaign.clicks || 0),
            installs: parseInt(installs || 0),
            cpi: cpi ? parseFloat(cpi).toFixed(2) : null,
            ctr: campaign.impressions > 0
                ? ((campaign.clicks / campaign.impressions) * 100).toFixed(2)
                : '0.00'
        };
    });
}

/**
 * Parse ad data and extract CPI + video metrics
 */
function parseAdData(ads) {
    return ads.map(ad => {
        const installs = getActionValue(ad.actions, 'mobile_app_install') ||
                        getActionValue(ad.actions, 'app_install') ||
                        getActionValue(ad.actions, 'omni_app_install');

        const cpi = getCostPerAction(ad.cost_per_action_type, 'mobile_app_install') ||
                   getCostPerAction(ad.cost_per_action_type, 'app_install') ||
                   getCostPerAction(ad.cost_per_action_type, 'omni_app_install');

        // Video retention metrics
        const videoPlays = getActionValue(ad.video_play_actions, 'video_view');
        const video25 = getActionValue(ad.video_p25_watched_actions, 'video_view');
        const video50 = getActionValue(ad.video_p50_watched_actions, 'video_view');
        const video75 = getActionValue(ad.video_p75_watched_actions, 'video_view');
        const video100 = getActionValue(ad.video_p100_watched_actions, 'video_view');

        return {
            adName: ad.ad_name,
            campaignName: ad.campaign_name,
            spend: parseFloat(ad.spend || 0).toFixed(2),
            impressions: parseInt(ad.impressions || 0),
            clicks: parseInt(ad.clicks || 0),
            installs: parseInt(installs || 0),
            cpi: cpi ? parseFloat(cpi).toFixed(2) : null,
            ctr: ad.impressions > 0
                ? ((ad.clicks / ad.impressions) * 100).toFixed(2)
                : '0.00',
            videoMetrics: videoPlays ? {
                plays: parseInt(videoPlays),
                retention25: video25 ? ((video25 / videoPlays) * 100).toFixed(1) : null,
                retention50: video50 ? ((video50 / videoPlays) * 100).toFixed(1) : null,
                retention75: video75 ? ((video75 / videoPlays) * 100).toFixed(1) : null,
                retention100: video100 ? ((video100 / videoPlays) * 100).toFixed(1) : null
            } : null
        };
    });
}

/**
 * Helper to extract action value
 */
function getActionValue(actions, actionType) {
    if (!actions) return null;
    const action = actions.find(a => a.action_type === actionType);
    return action ? action.value : null;
}

/**
 * Helper to extract cost per action
 */
function getCostPerAction(costs, actionType) {
    if (!costs) return null;
    const cost = costs.find(c => c.action_type === actionType);
    return cost ? cost.value : null;
}

/**
 * Format data for ChatGPT iteration prompt
 */
function formatForChatGPT(ads) {
    let output = 'MY TEST RESULTS:\n\n';

    // Sort by CPI (lowest first)
    const sorted = [...ads].sort((a, b) => {
        if (!a.cpi) return 1;
        if (!b.cpi) return -1;
        return parseFloat(a.cpi) - parseFloat(b.cpi);
    });

    sorted.forEach(ad => {
        output += `Hook: ${ad.adName}\n`;
        output += `CPI: ${ad.cpi ? `$${ad.cpi}` : 'N/A'}\n`;
        output += `Spend: $${ad.spend}\n`;
        output += `Installs: ${ad.installs}\n`;
        if (ad.videoMetrics) {
            output += `Video Retention: 25%=${ad.videoMetrics.retention25}%, 50%=${ad.videoMetrics.retention50}%, 75%=${ad.videoMetrics.retention75}%\n`;
        }
        output += '\n';
    });

    return output;
}

/**
 * Check if credentials are configured
 */
function isConfigured() {
    return FB_ACCESS_TOKEN !== 'YOUR_ACCESS_TOKEN_HERE' &&
           FB_AD_ACCOUNT_ID !== 'YOUR_AD_ACCOUNT_ID_HERE';
}

module.exports = {
    getCampaignPerformance,
    getAdPerformance,
    getCampaigns,
    formatForChatGPT,
    isConfigured
};
