const express = require('express');
const router = express.Router();
const facebookAdsService = require('../services/facebookAdsService');

/**
 * GET /api/facebook/status
 * Check if Facebook Ads is configured
 */
router.get('/status', (req, res) => {
    res.json({
        configured: facebookAdsService.isConfigured()
    });
});

/**
 * GET /api/facebook/campaigns
 * Get list of campaigns
 */
router.get('/campaigns', async (req, res) => {
    try {
        if (!facebookAdsService.isConfigured()) {
            return res.status(400).json({
                error: 'Facebook Ads not configured. Add your access token and ad account ID.'
            });
        }

        const campaigns = await facebookAdsService.getCampaigns();
        res.json({ data: campaigns });
    } catch (error) {
        console.error('[Facebook Ads Route] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/facebook/campaigns/performance
 * Get campaign-level performance metrics
 * Query params: datePreset, startDate, endDate
 */
router.get('/campaigns/performance', async (req, res) => {
    try {
        if (!facebookAdsService.isConfigured()) {
            return res.status(400).json({
                error: 'Facebook Ads not configured. Add your access token and ad account ID.'
            });
        }

        const { datePreset, startDate, endDate } = req.query;
        const data = await facebookAdsService.getCampaignPerformance({
            datePreset,
            startDate,
            endDate
        });

        res.json({ data });
    } catch (error) {
        console.error('[Facebook Ads Route] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/facebook/ads/performance
 * Get ad-level performance metrics (for hook analysis)
 * Query params: campaignId, datePreset, startDate, endDate
 */
router.get('/ads/performance', async (req, res) => {
    try {
        if (!facebookAdsService.isConfigured()) {
            return res.status(400).json({
                error: 'Facebook Ads not configured. Add your access token and ad account ID.'
            });
        }

        const { campaignId, datePreset, startDate, endDate } = req.query;
        const data = await facebookAdsService.getAdPerformance({
            campaignId,
            datePreset,
            startDate,
            endDate
        });

        res.json({ data });
    } catch (error) {
        console.error('[Facebook Ads Route] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/facebook/ads/export
 * Export ad data formatted for ChatGPT iteration prompt
 * Query params: campaignId, datePreset, startDate, endDate
 */
router.get('/ads/export', async (req, res) => {
    try {
        if (!facebookAdsService.isConfigured()) {
            return res.status(400).json({
                error: 'Facebook Ads not configured. Add your access token and ad account ID.'
            });
        }

        const { campaignId, datePreset, startDate, endDate } = req.query;
        const ads = await facebookAdsService.getAdPerformance({
            campaignId,
            datePreset,
            startDate,
            endDate
        });

        const formatted = facebookAdsService.formatForChatGPT(ads);

        res.json({
            data: ads,
            chatgptFormat: formatted
        });
    } catch (error) {
        console.error('[Facebook Ads Route] Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
