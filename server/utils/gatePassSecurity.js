const { randomInt } = require("crypto");

const GATE_PASS_OTP_LENGTH = 4;

function generateGatePassOtp() {
  return randomInt(1000, 10000).toString();
}

function isValidGatePassOtp(value) {
  return /^\d{4}$/.test(String(value || "").trim());
}

module.exports = {
  GATE_PASS_OTP_LENGTH,
  generateGatePassOtp,
  isValidGatePassOtp
};
