const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const prisma = require('../config/database');
const jwtConfig = require('../config/jwt');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * Verify Google ID token and return user info
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} - Google user info
 */
async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture
  };
}

/**
 * Authenticate with Google OAuth
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} - {user, accessToken, refreshToken}
 */
async function googleAuth(idToken) {
  try {
    // Verify the Google token
    const googleUser = await verifyGoogleToken(idToken);

    // Find or create user by googleId
    let user = await prisma.user.findUnique({
      where: { googleId: googleUser.googleId }
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: googleUser.name,
          picture: googleUser.picture,
          lastLoginAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          createdAt: true
        }
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          googleId: googleUser.googleId,
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture,
          lastLoginAt: new Date()
        },
        select: {
          id: true,
          email: true,
          name: true,
          picture: true,
          createdAt: true
        }
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    return {
      user,
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('[Auth Service] Google auth failed:', error.message);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - JWT refresh token
 * @returns {Object} - {accessToken, refreshToken}
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtConfig.refresh.secret);

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true }
    });

    if (!storedToken) {
      throw new Error('Invalid refresh token');
    }

    // Check if token is expired
    if (new Date() > storedToken.expiresAt) {
      // Delete expired token
      await prisma.refreshToken.delete({
        where: { id: storedToken.id }
      });
      throw new Error('Refresh token expired');
    }

    // Check if user is active
    if (!storedToken.user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({
      where: { id: storedToken.id }
    });

    // Generate new tokens (token rotation)
    const tokens = await generateTokens(decoded.userId);

    return tokens;
  } catch (error) {
    console.error('[Auth Service] Token refresh failed:', error.message);
    throw error;
  }
}

/**
 * Logout user by invalidating refresh token
 * @param {string} refreshToken - JWT refresh token
 */
async function logout(refreshToken) {
  try {
    // Delete refresh token from database
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken }
    });

    return { success: true };
  } catch (error) {
    console.error('[Auth Service] Logout failed:', error.message);
    throw error;
  }
}

/**
 * Generate JWT access and refresh tokens
 * @param {string} userId - User ID
 * @returns {Object} - {accessToken, refreshToken}
 */
async function generateTokens(userId) {
  // Generate access token
  const accessToken = jwt.sign(
    { userId },
    jwtConfig.access.secret,
    { expiresIn: jwtConfig.access.expiresIn }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { userId },
    jwtConfig.refresh.secret,
    { expiresIn: jwtConfig.refresh.expiresIn }
  );

  // Calculate expiration date for refresh token (7 days)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt
    }
  });

  return {
    accessToken,
    refreshToken
  };
}

module.exports = {
  googleAuth,
  refreshAccessToken,
  logout
};
