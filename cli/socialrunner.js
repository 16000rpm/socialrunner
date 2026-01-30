#!/usr/bin/env node

const API_BASE = 'https://social-runner-api.onrender.com/api/proxy';
const FB_API_BASE = 'https://social-runner-api.onrender.com/api/facebook';
const YOUTUBE_API_KEY = 'AIzaSyCtuxXmT-uCDVCTIHmbP_wLS3kGsGNO-rE';

const args = process.argv.slice(2);
const command = args[0];
const platform = args[1];
const query = args.slice(2).join(' ');

const HELP = `
Social Runner CLI

Usage:
  socialrunner search <platform> <query>
  socialrunner user <platform> <username>
  socialrunner fbads [dateRange]          - Get Facebook Ads performance
  socialrunner fbads export [dateRange]   - Export for ChatGPT iteration

Platforms: youtube, instagram, tiktok

Date Ranges: today, yesterday, last_3d, last_7d, last_14d, last_30d

Examples:
  socialrunner search instagram comedy
  socialrunner search tiktok dance
  socialrunner search youtube tech review
  socialrunner user instagram therock
  socialrunner user tiktok charlidamelio
  socialrunner user youtube MrBeast
  socialrunner fbads last_7d
  socialrunner fbads export last_14d
`;

async function searchInstagram(keyword) {
    const res = await fetch(`${API_BASE}/instagram/searchreels?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();

    if (!data.data?.items?.length) {
        console.log('No results found.');
        return;
    }

    console.log(`\n📸 Instagram results for "${keyword}":\n`);
    console.log('─'.repeat(80));

    data.data.items.slice(0, 10).forEach((item, i) => {
        const user = item.caption?.user?.username || 'unknown';
        const likes = formatNumber(item.like_count || 0);
        const views = formatNumber(item.play_count || 0);
        const caption = (item.caption?.text || 'No caption').slice(0, 60).replace(/\n/g, ' ');

        console.log(`${i + 1}. @${user}`);
        console.log(`   ❤️  ${likes} likes | 👁️  ${views} views`);
        console.log(`   📝 ${caption}...`);
        console.log('');
    });
}

async function searchTikTok(keyword) {
    const res = await fetch(`${API_BASE}/tiktok/search/general?keyword=${encodeURIComponent(keyword)}`);
    const data = await res.json();

    if (!data.data?.length) {
        console.log('No results found.');
        return;
    }

    console.log(`\n🎵 TikTok results for "${keyword}":\n`);
    console.log('─'.repeat(80));

    data.data.slice(0, 10).forEach((item, i) => {
        const video = item.item;
        if (!video) return;

        const user = video.author?.uniqueId || 'unknown';
        const likes = formatNumber(video.stats?.diggCount || 0);
        const views = formatNumber(video.stats?.playCount || 0);
        const desc = (video.desc || 'No description').slice(0, 60).replace(/\n/g, ' ');

        console.log(`${i + 1}. @${user}`);
        console.log(`   ❤️  ${likes} likes | 👁️  ${views} views`);
        console.log(`   📝 ${desc}...`);
        console.log('');
    });
}

async function searchYouTube(keyword) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items?.length) {
        console.log('No results found.');
        return;
    }

    console.log(`\n📺 YouTube results for "${keyword}":\n`);
    console.log('─'.repeat(80));

    data.items.forEach((item, i) => {
        const title = item.snippet?.title || 'No title';
        const channel = item.snippet?.channelTitle || 'Unknown';
        const videoId = item.id?.videoId;

        console.log(`${i + 1}. ${title}`);
        console.log(`   📺 ${channel}`);
        console.log(`   🔗 https://youtube.com/watch?v=${videoId}`);
        console.log('');
    });
}

async function userInstagram(username) {
    const res = await fetch(`${API_BASE}/instagram/userreels?username_or_id=${encodeURIComponent(username)}`);
    const data = await res.json();

    const items = data.data?.items || data.items || data;

    if (!items?.length) {
        console.log('No reels found for this user.');
        return;
    }

    console.log(`\n📸 Instagram reels from @${username}:\n`);
    console.log('─'.repeat(80));

    (Array.isArray(items) ? items : []).slice(0, 10).forEach((item, i) => {
        const likes = formatNumber(item.like_count || 0);
        const views = formatNumber(item.play_count || 0);
        const caption = (item.caption?.text || 'No caption').slice(0, 60).replace(/\n/g, ' ');

        console.log(`${i + 1}. ❤️  ${likes} likes | 👁️  ${views} views`);
        console.log(`   📝 ${caption}...`);
        console.log('');
    });
}

async function userTikTok(username) {
    // First get user info to get secUid
    const infoRes = await fetch(`${API_BASE}/tiktok/user/info?uniqueId=${encodeURIComponent(username)}`);
    const infoData = await infoRes.json();

    const user = infoData.userInfo?.user;
    if (!user) {
        console.log('User not found.');
        return;
    }

    console.log(`\n🎵 TikTok user @${user.uniqueId}:\n`);
    console.log('─'.repeat(80));
    console.log(`   👤 ${user.nickname || user.uniqueId}`);
    console.log(`   👥 ${formatNumber(infoData.userInfo?.stats?.followerCount || 0)} followers`);
    console.log(`   ❤️  ${formatNumber(infoData.userInfo?.stats?.heartCount || 0)} likes`);
    console.log(`   🎬 ${formatNumber(infoData.userInfo?.stats?.videoCount || 0)} videos`);
    console.log('');

    // Get popular posts
    const postsRes = await fetch(`${API_BASE}/tiktok/user/popular-posts?secUid=${encodeURIComponent(user.secUid)}&count=10`);
    const postsData = await postsRes.json();

    const posts = postsData.data?.itemList || [];
    if (posts.length) {
        console.log('Popular posts:');
        console.log('─'.repeat(80));
        posts.slice(0, 5).forEach((post, i) => {
            const likes = formatNumber(post.stats?.diggCount || 0);
            const views = formatNumber(post.stats?.playCount || 0);
            const desc = (post.desc || 'No description').slice(0, 50).replace(/\n/g, ' ');

            console.log(`${i + 1}. ❤️  ${likes} | 👁️  ${views} | ${desc}...`);
        });
    }
}

async function userYouTube(handle) {
    // Search for channel
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(handle)}&type=channel&maxResults=1&key=${YOUTUBE_API_KEY}`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    if (!searchData.items?.length) {
        console.log('Channel not found.');
        return;
    }

    const channelId = searchData.items[0].snippet.channelId;
    const channelTitle = searchData.items[0].snippet.title;

    // Get channel stats
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${YOUTUBE_API_KEY}`;
    const channelRes = await fetch(channelUrl);
    const channelData = await channelRes.json();

    const channel = channelData.items?.[0];
    if (channel) {
        console.log(`\n📺 YouTube channel ${channelTitle}:\n`);
        console.log('─'.repeat(80));
        console.log(`   👥 ${formatNumber(channel.statistics?.subscriberCount || 0)} subscribers`);
        console.log(`   👁️  ${formatNumber(channel.statistics?.viewCount || 0)} total views`);
        console.log(`   🎬 ${formatNumber(channel.statistics?.videoCount || 0)} videos`);
        console.log('');
    }

    // Get recent videos
    const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=date&maxResults=5&key=${YOUTUBE_API_KEY}`;
    const videosRes = await fetch(videosUrl);
    const videosData = await videosRes.json();

    if (videosData.items?.length) {
        console.log('Recent videos:');
        console.log('─'.repeat(80));
        videosData.items.forEach((video, i) => {
            const title = (video.snippet?.title || 'No title').slice(0, 60);
            console.log(`${i + 1}. ${title}`);
        });
    }
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

async function fbAdsPerformance(dateRange = 'last_7d') {
    const res = await fetch(`${FB_API_BASE}/ads/performance?datePreset=${dateRange}`);
    const data = await res.json();

    if (data.error) {
        console.log('Error:', data.error);
        return;
    }

    if (!data.data?.length) {
        console.log('No ad data found.');
        return;
    }

    console.log(`\n📊 Facebook Ads Performance (${dateRange}):\n`);
    console.log('─'.repeat(100));

    // Sort by CPI (lowest first)
    const sorted = data.data.sort((a, b) => {
        if (!a.cpi) return 1;
        if (!b.cpi) return -1;
        return parseFloat(a.cpi) - parseFloat(b.cpi);
    });

    // Summary
    const totalSpend = sorted.reduce((sum, a) => sum + parseFloat(a.spend), 0);
    const totalInstalls = sorted.reduce((sum, a) => sum + a.installs, 0);
    const avgCpi = totalInstalls > 0 ? (totalSpend / totalInstalls).toFixed(2) : 'N/A';

    console.log(`Summary: ${sorted.length} ads | $${totalSpend.toFixed(2)} spend | ${totalInstalls} installs | $${avgCpi} avg CPI\n`);
    console.log('─'.repeat(100));

    sorted.forEach((ad, i) => {
        const cpiColor = ad.cpi && parseFloat(ad.cpi) < 1 ? '🟢' :
                        ad.cpi && parseFloat(ad.cpi) > 3 ? '🔴' : '🟡';
        console.log(`${i + 1}. ${ad.adName}`);
        console.log(`   ${cpiColor} CPI: ${ad.cpi ? `$${ad.cpi}` : 'N/A'} | Spend: $${ad.spend} | Installs: ${ad.installs} | CTR: ${ad.ctr}%`);
        console.log('');
    });
}

async function fbAdsExport(dateRange = 'last_7d') {
    const res = await fetch(`${FB_API_BASE}/ads/export?datePreset=${dateRange}`);
    const data = await res.json();

    if (data.error) {
        console.log('Error:', data.error);
        return;
    }

    console.log('\n📋 Copy this into ChatGPT Iteration Prompt:\n');
    console.log('═'.repeat(60));
    console.log(data.chatgptFormat);
    console.log('═'.repeat(60));
}

async function main() {
    if (!command || command === 'help' || command === '--help' || command === '-h') {
        console.log(HELP);
        return;
    }

    // Handle fbads command (doesn't require platform/query)
    if (command === 'fbads') {
        try {
            if (platform === 'export') {
                await fbAdsExport(query || 'last_7d');
            } else {
                await fbAdsPerformance(platform || 'last_7d');
            }
        } catch (error) {
            console.error('Error:', error.message);
        }
        return;
    }

    if (!platform || !query) {
        console.log('Missing arguments. Use --help for usage.');
        return;
    }

    try {
        if (command === 'search') {
            switch (platform.toLowerCase()) {
                case 'instagram':
                case 'ig':
                    await searchInstagram(query);
                    break;
                case 'tiktok':
                case 'tt':
                    await searchTikTok(query);
                    break;
                case 'youtube':
                case 'yt':
                    await searchYouTube(query);
                    break;
                default:
                    console.log('Unknown platform. Use: instagram, tiktok, or youtube');
            }
        } else if (command === 'user') {
            switch (platform.toLowerCase()) {
                case 'instagram':
                case 'ig':
                    await userInstagram(query);
                    break;
                case 'tiktok':
                case 'tt':
                    await userTikTok(query);
                    break;
                case 'youtube':
                case 'yt':
                    await userYouTube(query);
                    break;
                default:
                    console.log('Unknown platform. Use: instagram, tiktok, or youtube');
            }
        } else {
            console.log('Unknown command. Use: search or user');
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();
