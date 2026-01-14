const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const jwtConfig = require('../config/jwt');

const BCRYPT_ROUNDS = 12;

/**
 * Sign up a new user
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Object} - {user, accessToken, refreshToken}
 */
async function signup(email, password) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        lastLoginAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      }
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    return {
      user,
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('[Auth Service] Signup failed:', error.message);
    throw error;
  }
}

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - Plain text password
 * @returns {Object} - {user, accessToken, refreshToken}
 */
async function login(email, password) {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      },
      accessToken,
      refreshToken
    };
  } catch (error) {
    console.error('[Auth Service] Login failed:', error.message);
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
  signup,
  login,
  refreshAccessToken,
  logout
};
