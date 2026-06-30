/**
 * utils/responseHelper.js
 * Standardized HTTP response helpers
 */

const { HTTP_STATUS } = require("../config/constants");

/**
 * Sends a success response.
 * @param {Object} res - Express response object
 * @param {Object} data - Response payload
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, data, statusCode = HTTP_STATUS.OK) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Sends an error response.
 * @param {Object} res - Express response object
 * @param {string|string[]} message - Error message(s)
 * @param {number} [statusCode=500]
 */
function sendError(res, message, statusCode = HTTP_STATUS.INTERNAL_ERROR) {
  return res.status(statusCode).json({
    success: false,
    error: Array.isArray(message) ? message : [message],
  });
}

module.exports = { sendSuccess, sendError };