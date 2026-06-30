"use strict";

/**
 * Sends a standardized success response.
 * @param {object} res - Express response object
 * @param {object} data - Payload to return
 * @param {number} [statusCode=200]
 */
function sendSuccess(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Sends a standardized error response.
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=500]
 */
function sendError(res, message, statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

module.exports = { sendSuccess, sendError };