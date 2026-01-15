const crypto = require('crypto');
const bcrypt = require('bcrypt');
const prisma = require('../config/database');
const { sendPasswordResetEmail } = require('./emailService');

const BCRYPT_ROUNDS = 12;
const TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a secure random token
 */
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Request password reset - generates token and sends email
 * @param {string} email - User email
 * @param {string} frontendUrl - Frontend URL for reset link
 */
async function requestPasswordReset(email, frontendUrl) {
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log('[Password Reset] No user found for email:', email);
      return { success: true };
    }

    // Delete any existing reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id }
    });

    // Generate new token
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + TOKEN_EXPIRY_HOURS);

    // Store token in database
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt
      }
    });

    // Build reset URL
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // Send email
    await sendPasswordResetEmail(user.email, token, resetUrl);

    console.log('[Password Reset] Reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('[Password Reset] Error requesting reset:', error.message);
    throw error;
  }
}

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 */
async function resetPassword(token, newPassword) {
  try {
    // Find token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      await prisma.passwordResetToken.delete({ where: { id: resetToken.id } });
      throw new Error('Reset token has expired');
    }

    // Check if token was already used
    if (resetToken.used) {
      throw new Error('Reset token has already been used');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    // Delete all refresh tokens for this user (force re-login)
    await prisma.refreshToken.deleteMany({
      where: { userId: resetToken.userId }
    });

    console.log('[Password Reset] Password reset successful for user:', resetToken.user.email);
    return { success: true };
  } catch (error) {
    console.error('[Password Reset] Error resetting password:', error.message);
    throw error;
  }
}

module.exports = {
  requestPasswordReset,
  resetPassword
};
