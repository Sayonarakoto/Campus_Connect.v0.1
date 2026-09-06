const { sendErrorResponse } = require("../utils/errorHandler");

/**
 * Global Express error handling middleware.
 * Intercepts all unhandled errors passed via next(err) and guarantees
 * zero internal database, schema, or transaction leaks to the client.
 */
module.exports = (err, req, res, next) => {
  return sendErrorResponse(res, err);
};