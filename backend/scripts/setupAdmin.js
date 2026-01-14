require('dotenv').config();
const authService = require('../src/services/authService');
const apiKeyService = require('../src/services/apiKeyService');
const prisma = require('../src/config/database');

async function setupAdmin() {
  try {
    console.log('[Setup] Starting admin setup...');

    // Get config from environment
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const youtubeApiKey = process.env.YOUTUBE_API_KEY;
    const rapidApiKey = process.env.RAPIDAPI_KEY;

    // Validate required env vars
    if (!adminEmail || !adminPassword) {
      throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
    }

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() }
    });

    if (existingAdmin) {
      console.log('[Setup] Admin user already exists:', adminEmail);
    } else {
      // Create admin user
      const { user } = await authService.signup(adminEmail, adminPassword);
      console.log('[Setup] Admin user created:', user.email);
    }

    // Set up API keys if provided
    if (youtubeApiKey && youtubeApiKey !== 'your-youtube-api-key') {
      await apiKeyService.setApiKey('youtube', youtubeApiKey);
      console.log('[Setup] YouTube API key configured');
    } else {
      console.log('[Setup] YouTube API key not configured (set YOUTUBE_API_KEY in .env)');
    }

    if (rapidApiKey && rapidApiKey !== 'your-rapidapi-key') {
      await apiKeyService.setApiKey('rapidapi', rapidApiKey);
      console.log('[Setup] RapidAPI key configured');
    } else {
      console.log('[Setup] RapidAPI key not configured (set RAPIDAPI_KEY in .env)');
    }

    console.log('[Setup] ✓ Setup completed successfully!');
    console.log('[Setup] You can now login with:', adminEmail);

  } catch (error) {
    console.error('[Setup] Setup failed:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run setup
setupAdmin();
