// server/services/emailService.js
const nodemailer = require("nodemailer");

/**
 * Creates and returns the configured Nodemailer transporter using environment variables.
 * @returns {nodemailer.Transporter}
 */
function createTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT, 10) || 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("⚠️ SMTP credentials missing in environment variables. Outbound emails will fail.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass
    }
  });
}

const transporter = createTransporter();

/**
 * Verifies SMTP connection handshake.
 * @returns {Promise<boolean>}
 */
async function verifyConnection() {
  try {
    await transporter.verify();
    console.log("✅ SMTP Server Connection Verified Successfully.");
    return true;
  } catch (error) {
    console.error("❌ SMTP Server Connection Error:", error.message);
    return false;
  }
}

/**
 * Sends a generic HTML/text email.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content
 * @param {string} [options.text] - Fallback plaintext content
 * @returns {Promise<Object>} Nodemailer send result
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const fromAddress = process.env.DEFAULT_FROM_EMAIL || process.env.SMTP_USER || "noreply.ileave@gmail.com";
    const info = await transporter.sendMail({
      from: `"Campus Connect - St. Mary's Polytechnic College" <${fromAddress}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ""),
      html
    });
    console.log(`📧 Email sent to ${to} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    throw new Error(`Email delivery failed: ${error.message}`);
  }
}

/**
 * Sends a 6-digit Password Reset OTP email.
 * @param {string} email - Recipient email
 * @param {string} fullName - Recipient full name
 * @param {string} otp - 6-digit OTP string
 * @returns {Promise<Object>}
 */
async function sendPasswordResetOTP(email, fullName, otp) {
  const subject = "Password Reset Verification Code - Campus Connect";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset OTP</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <div style="background-color: #0c2340; padding: 28px 24px; text-align: center; border-bottom: 4px solid #d4af37;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Campus Connect</h1>
            <p style="color: #d4af37; margin: 6px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">St. Mary's Polytechnic College, Valliyode</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 28px;">
            <h2 style="color: #0c2340; margin: 0 0 16px; font-size: 19px; font-weight: 600;">Password Reset Request</h2>
            <p style="margin: 0 0 16px; line-height: 1.6; font-size: 15px; color: #334155;">
              Hello <strong>${fullName || "Campus Member"}</strong>,
            </p>
            <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px; color: #334155;">
              We received an institutional request to reset the password for your account associated with <strong>${email}</strong>. Use the 6-digit one-time passkey (OTP) below to authenticate your identity:
            </p>

            <!-- OTP Box -->
            <div style="text-align: center; margin: 30px 0; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 22px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0c2340; display: inline-block;">
                ${otp}
              </span>
              <p style="margin: 10px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">
                ⏱️ Code valid for <strong>10 minutes</strong>. Do not share this code with anyone.
              </p>
            </div>

            <p style="margin: 0 0 12px; line-height: 1.5; font-size: 14px; color: #64748b;">
              If you did not initiate this password reset, no further action is required. Your password remains unchanged.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">This is an automated institutional notification from St. Mary's Polytechnic College Campus Connect.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Sends a 6-digit Parent Login OTP email.
 * @param {string} email - Parent registered email
 * @param {string} fullName - Parent full name
 * @param {string} otp - 6-digit OTP string
 * @returns {Promise<Object>}
 */
async function sendParentLoginOTP(email, fullName, otp) {
  const subject = "Parent Portal Login Verification Code - Campus Connect";
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Parent Portal Login OTP</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <div style="max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <div style="background-color: #0c2340; padding: 28px 24px; text-align: center; border-bottom: 4px solid #d4af37;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">Campus Connect</h1>
            <p style="color: #d4af37; margin: 6px 0 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Parent Digital Gateway</p>
          </div>

          <!-- Body -->
          <div style="padding: 32px 28px;">
            <h2 style="color: #0c2340; margin: 0 0 16px; font-size: 19px; font-weight: 600;">Parent Portal Sign In</h2>
            <p style="margin: 0 0 16px; line-height: 1.6; font-size: 15px; color: #334155;">
              Dear <strong>${fullName || "Parent/Guardian"}</strong>,
            </p>
            <p style="margin: 0 0 24px; line-height: 1.6; font-size: 15px; color: #334155;">
              You have requested access to the Parent Gateway for real-time leave approvals, academic attendance, and campus notifications. Please enter the following 6-digit login verification code:
            </p>

            <!-- OTP Box -->
            <div style="text-align: center; margin: 30px 0; background: #f8fafc; border: 2px dashed #0284c7; border-radius: 10px; padding: 22px;">
              <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #0284c7; display: inline-block;">
                ${otp}
              </span>
              <p style="margin: 10px 0 0; font-size: 13px; color: #64748b; font-weight: 500;">
                ⏱️ Code valid for <strong>10 minutes</strong>. Single-use access passkey.
              </p>
            </div>

            <p style="margin: 0 0 12px; line-height: 1.5; font-size: 14px; color: #64748b;">
              If you did not request access to the parent portal, please notify the college office immediately.
            </p>
          </div>

          <!-- Footer -->
          <div style="background-color: #f8fafc; padding: 18px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
            <p style="margin: 0;">St. Mary's Polytechnic College, Valliyode • Student Welfare & Attendance Cell</p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({ to: email, subject, html });
}

module.exports = {
  sendEmail,
  sendPasswordResetOTP,
  sendParentLoginOTP,
  verifyConnection
};
