// server/utils/errorHandler.js

/**
 * Centralized Error Sanitizer and Response Formatter.
 * Prevents any internal database, Mongoose, transaction, or server stack traces from leaking to the client.
 * Translates technical exceptions into human-friendly, polite institutional notifications.
 */

/**
 * Categorizes and formats an error into a safe, client-facing status and message.
 * @param {Error|Object} err - The captured error object
 * @param {string} [fallbackMessage="An unexpected system error occurred."] - Contextual fallback message
 * @returns {{ statusCode: number, message: string }}
 */
function sanitizeError(err, fallbackMessage = "An unexpected institutional server error occurred.") {
  // Default values
  let statusCode = err?.statusCode || err?.status || 500;
  let message = fallbackMessage;

  if (!err) {
    return { statusCode, message };
  }

  // ========================================================
  // 1. MONGODB DUPLICATE KEY ERROR (Code 11000)
  // ========================================================
  if (err.code === 11000 || (err.name === "MongoServerError" && err.code === 11000)) {
    statusCode = 409; // Conflict
    const keyValue = err.keyValue || {};
    const keyPattern = err.keyPattern || {};
    const duplicatedField = Object.keys(keyValue)[0] || Object.keys(keyPattern)[0] || "";

    if (duplicatedField.includes("email")) {
      message = "An account with this institutional email address already exists. Please log in or use a different email.";
    } else if (duplicatedField.includes("phoneNumber")) {
      message = "An account with this mobile number is already registered. Please check or sign in.";
    } else if (duplicatedField.includes("employeeId")) {
      message = `An account with Faculty ID '${keyValue[duplicatedField] || ""}' already exists.`;
    } else if (duplicatedField.includes("staffId")) {
      message = `An account with Staff ID '${keyValue[duplicatedField] || ""}' already exists.`;
    } else if (duplicatedField.includes("admissionNo")) {
      message = "A student profile with this Admission Number already exists.";
    } else if (duplicatedField.includes("regNo")) {
      message = "A student profile with this Register Number already exists.";
    } else {
      message = "A record with these credentials already exists in the institutional directory.";
    }
    return { statusCode, message };
  }

  // ========================================================
  // 2. MONGOOSE SCHEMA VALIDATION ERROR
  // ========================================================
  if (err.name === "ValidationError") {
    statusCode = 400; // Bad Request
    if (err.errors) {
      const firstKey = Object.keys(err.errors)[0];
      const firstError = err.errors[firstKey];
      message = firstError?.message || "Please verify that all required institutional fields are filled correctly.";
    } else {
      message = err.message || "Invalid input data provided.";
    }
    return { statusCode, message };
  }

  // ========================================================
  // 3. MONGOOSE CAST ERROR (Invalid ObjectId / Malformed ID)
  // ========================================================
  if (err.name === "CastError") {
    statusCode = 400;
    message = "The requested institutional record could not be found or has an invalid reference format.";
    return { statusCode, message };
  }

  // ========================================================
  // 4. MULTER FILE UPLOAD ERRORS
  // ========================================================
  if (err.name === "MulterError") {
    statusCode = 400;
    if (err.code === "LIMIT_FILE_SIZE") {
      message = "Uploaded file exceeds the maximum allowed limit of 5MB. Please upload a smaller file.";
    } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
      message = "Unexpected file field detected in the upload request.";
    } else {
      message = `File upload notice: ${err.message}`;
    }
    return { statusCode, message };
  }

  // ========================================================
  // 5. JSON WEB TOKEN ERRORS
  // ========================================================
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid access token. Please authenticate through your institutional portal.";
    return { statusCode, message };
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Your institutional access session has expired. Please log in again.";
    return { statusCode, message };
  }

  // ========================================================
  // 6. DATABASE CONNECTION & TRANSACTION ERRORS
  // ========================================================
  if (
    err.name === "MongooseServerSelectionError" ||
    err.name === "MongoTimeoutError" ||
    err.name === "MongoNetworkError"
  ) {
    statusCode = 503;
    message = "Campus database service is momentarily unavailable. Please try again in a moment.";
    return { statusCode, message };
  }

  // ========================================================
  // 7. GENERIC / UNHANDLED SERVER ERRORS
  // ========================================================
  // Only surface safe custom messages explicitly set with a 4xx statusCode
  if (statusCode >= 400 && statusCode < 500 && err.message) {
    message = err.message;
  } else {
    // For 500 errors, mask internal implementation details completely
    message = "An unexpected institutional server error occurred. Our technical team has been notified. Please try again shortly.";
  }

  return { statusCode, message };
}

/**
 * Express helper function to log technical details on server console and send a sanitized response to the client.
 * @param {import("express").Response} res - Express response object
 * @param {Error|Object} err - Captured error
 * @param {string} [contextNotice] - Optional contextual fallback notice
 * @param {number} [overrideStatus] - Optional explicit status code override
 * @returns {import("express").Response}
 */
function sendErrorResponse(res, err, contextNotice, overrideStatus) {
  // Always log complete technical error details on server for debugging
  console.error("❌ INTERNAL EXCEPTION LOGGED:", {
    name: err?.name,
    code: err?.code,
    message: err?.message,
    stack: err?.stack
  });

  const { statusCode, message } = sanitizeError(err, contextNotice);
  const finalStatus = overrideStatus || statusCode;

  return res.status(finalStatus).json({
    success: false,
    message
  });
}

module.exports = {
  sanitizeError,
  sendErrorResponse
};
