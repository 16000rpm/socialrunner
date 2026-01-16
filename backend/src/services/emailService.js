const { Resend } = require('resend');

// Initialize Resend client
const RESEND_API_KEY = 're_CpuZ2CGm_Nx6kKkmQpJ2S9UwdtuQkaGYu';
const resend = new Resend(RESEND_API_KEY);

function getResendClient() {
  return resend;
}

// Use Resend's default domain for testing, or custom domain if verified
const FROM_EMAIL = process.env.FROM_EMAIL || 'Social Runner <onboarding@resend.dev>';

/**
 * Send password reset email
 * @param {string} to - Recipient email
 * @param {string} resetToken - Password reset token
 * @param {string} resetUrl - Full URL for password reset
 */
async function sendPasswordResetEmail(to, resetToken, resetUrl) {
  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: 'Reset Your Social Runner Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0f; color: #ffffff; padding: 40px 20px; margin: 0;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #12121a; border-radius: 12px; padding: 40px; border: 1px solid #1e1e2e;">
            <h1 style="color: #00c9ff; margin: 0 0 24px 0; font-size: 24px;">Password Reset Request</h1>

            <p style="color: #a0a0b0; line-height: 1.6; margin: 0 0 24px 0;">
              We received a request to reset your password for your Social Runner account. Click the button below to create a new password.
            </p>

            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #00c9ff 0%, #92fe9d 100%); color: #000000; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; margin: 0 0 24px 0;">
              Reset Password
            </a>

            <p style="color: #606070; font-size: 14px; line-height: 1.6; margin: 0 0 16px 0;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #1e1e2e; margin: 24px 0;">

            <p style="color: #404050; font-size: 12px; margin: 0;">
              &copy; 2025 Rahul Prakash Menon. All rights reserved.
            </p>
          </div>
        </body>
        </html>
      `
    });

    if (error) {
      console.error('[Email Service] Failed to send email:', error);
      throw new Error('Failed to send email');
    }

    console.log('[Email Service] Password reset email sent to:', to);
    return data;
  } catch (error) {
    console.error('[Email Service] Error:', error.message);
    throw error;
  }
}

module.exports = {
  sendPasswordResetEmail
};
