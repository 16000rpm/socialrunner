const express = require('express');
const router = express.Router();

// RapidAPI key
const RAPIDAPI_KEY = '7eea8aa987msh95d4c337a9d2561p1ede3fjsn02ca1a194629';

/**
 * Instagram API Proxy
 * Proxies requests to instagram-scraper-20251.p.rapidapi.com
 */
const INSTAGRAM_HOST = 'instagram-scraper-20251.p.rapidapi.com';
const INSTAGRAM_BASE_URL = `https://${INSTAGRAM_HOST}`;

// Instagram search reels
router.get('/instagram/searchreels', async (req, res) => {
  try {
    const { keyword, pagination_token } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: 'keyword parameter is required' });
    }

    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ error: 'RapidAPI key not configured on server' });
    }

    let url = `${INSTAGRAM_BASE_URL}/searchreels/?keyword=${encodeURIComponent(keyword)}`;
    if (pagination_token) {
      url += `&pagination_token=${encodeURIComponent(pagination_token)}`;
    }

    console.log(`[Proxy] Instagram searchReels: ${keyword}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': INSTAGRAM_HOST
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Instagram API error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Proxy] Instagram searchReels error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Instagram user reels
router.get('/instagram/userreels', async (req, res) => {
  try {
    const { username_or_id, pagination_token } = req.query;

    if (!username_or_id) {
      return res.status(400).json({ error: 'username_or_id parameter is required' });
    }

    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ error: 'RapidAPI key not configured on server' });
    }

    let url = `${INSTAGRAM_BASE_URL}/userreels/?username_or_id=${encodeURIComponent(username_or_id)}`;
    if (pagination_token) {
      url += `&pagination_token=${encodeURIComponent(pagination_token)}`;
    }

    console.log(`[Proxy] Instagram userReels: ${username_or_id}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': INSTAGRAM_HOST
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] Instagram API error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('[Proxy] Instagram userReels error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * TikTok API Proxy
 * Proxies requests to tiktok-api23.p.rapidapi.com
 */
const TIKTOK_HOST = 'tiktok-api23.p.rapidapi.com';
const TIKTOK_BASE_URL = `https://${TIKTOK_HOST}/api`;

// TikTok search videos
router.get('/tiktok/search/general', async (req, res) => {
  try {
    const { keyword, cursor = 0, search_id = 0 } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: 'keyword parameter is required' });
    }

    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ error: 'RapidAPI key not configured on server' });
    }

    const url = `${TIKTOK_BASE_URL}/search/general?keyword=${encodeURIComponent(keyword)}&cursor=${cursor}&search_id=${search_id}`;

    console.log(`[Proxy] TikTok search: ${keyword}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': TIKTOK_HOST
      }
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return res.json({ data: [] });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] TikTok API error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const text = await response.text();
    if (!text) {
      return res.json({ data: [] });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error('[Proxy] TikTok search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// TikTok user info
router.get('/tiktok/user/info', async (req, res) => {
  try {
    const { uniqueId } = req.query;

    if (!uniqueId) {
      return res.status(400).json({ error: 'uniqueId parameter is required' });
    }

    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ error: 'RapidAPI key not configured on server' });
    }

    const url = `${TIKTOK_BASE_URL}/user/info?uniqueId=${encodeURIComponent(uniqueId)}`;

    console.log(`[Proxy] TikTok user info: ${uniqueId}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': TIKTOK_HOST
      }
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return res.json({ userInfo: null });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] TikTok API error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const text = await response.text();
    if (!text) {
      return res.json({ userInfo: null });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error('[Proxy] TikTok user info error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// TikTok user popular posts
router.get('/tiktok/user/popular-posts', async (req, res) => {
  try {
    const { secUid, count = 35, cursor = 0 } = req.query;

    if (!secUid) {
      return res.status(400).json({ error: 'secUid parameter is required' });
    }

    if (!RAPIDAPI_KEY) {
      return res.status(500).json({ error: 'RapidAPI key not configured on server' });
    }

    const url = `${TIKTOK_BASE_URL}/user/popular-posts?secUid=${encodeURIComponent(secUid)}&count=${count}&cursor=${cursor}`;

    console.log(`[Proxy] TikTok user popular posts: ${secUid}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY,
        'x-rapidapi-host': TIKTOK_HOST
      }
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return res.json({ data: { itemList: [] } });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Proxy] TikTok API error: ${response.status}`, errorText);
      return res.status(response.status).json({ error: errorText });
    }

    const text = await response.text();
    if (!text) {
      return res.json({ data: { itemList: [] } });
    }

    const data = JSON.parse(text);
    res.json(data);
  } catch (error) {
    console.error('[Proxy] TikTok popular posts error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
