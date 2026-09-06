// server/middleware/validateAuth.js

/**
 * Validation Middleware for authentication, password recovery, and OTP workflows.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;
const OTP_REGEX = /^\d{6}$/;

/**
 * Validates forgot password payload.
 * Expected: { email }
 */
exports.validateForgotPassword = (req, res, next) => {
  const { email } = req.body;
  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid institutional email address."
    });
  }
  req.body.email = email.toLowerCase().trim();
  next();
};

/**
 * Validates reset password payload.
 * Expected: { email, otp, newPassword }
 */
exports.validateResetPassword = (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address."
    });
  }

  const cleanOtp = (otp || "").toString().trim();
  if (!cleanOtp || !OTP_REGEX.test(cleanOtp)) {
    return res.status(400).json({
      success: false,
      message: "Verification code must be exactly 6 numeric digits."
    });
  }

  if (!newPassword || typeof newPassword !== "string" || newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long."
    });
  }

  req.body.email = email.toLowerCase().trim();
  req.body.otp = cleanOtp;
  next();
};

/**
 * Validates request to send a parent login OTP.
 * Expected: { identifier } (email or 10-digit mobile number)
 */
exports.validateParentSendOTP = (req, res, next) => {
  const identifier = (req.body.identifier || req.body.email || req.body.phoneNumber || "").toString().trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: "Please provide your registered email address or 10-digit mobile number."
    });
  }

  const isEmail = EMAIL_REGEX.test(identifier);
  const isPhone = PHONE_REGEX.test(identifier);

  if (!isEmail && !isPhone) {
    return res.status(400).json({
      success: false,
      message: "Invalid credential format. Enter a valid email or 10-digit mobile number."
    });
  }

  req.body.identifier = identifier;
  req.body.isEmail = isEmail;
  req.body.isPhone = isPhone;
  next();
};

/**
 * Validates request to verify parent login OTP.
 * Expected: { identifier, otp }
 */
exports.validateParentVerifyOTP = (req, res, next) => {
  const identifier = (req.body.identifier || req.body.email || req.body.phoneNumber || "").toString().trim();
  const cleanOtp = (req.body.otp || "").toString().trim();

  if (!identifier) {
    return res.status(400).json({
      success: false,
      message: "Identifier (email or mobile number) is required."
    });
  }

  if (!cleanOtp || !OTP_REGEX.test(cleanOtp)) {
    return res.status(400).json({
      success: false,
      message: "Login OTP must be exactly 6 numeric digits."
    });
  }

  req.body.identifier = identifier;
  req.body.otp = cleanOtp;
  next();
};
