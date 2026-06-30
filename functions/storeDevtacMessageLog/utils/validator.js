/**
 * utils/validator.js
 * Input validation for message log payloads
 */

const { CHANNELS, MESSAGE_STATUS } = require("../config/constants");

/**
 * Validates the incoming log payload.
 * @param {Object} body - Request body
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateLogPayload(body) {
  const errors = [];

  const validChannels = Object.values(CHANNELS);
  const validStatuses = Object.values(MESSAGE_STATUS);

  if (!body.channel) {
    errors.push("'channel' is required.");
  } else if (!validChannels.includes(body.channel)) {
    errors.push(`'channel' must be one of: ${validChannels.join(", ")}.`);
  }

  if (!body.message_status) {
    errors.push("'message_status' is required.");
  } else if (!validStatuses.includes(body.message_status)) {
    errors.push(`'message_status' must be one of: ${validStatuses.join(", ")}.`);
  }

  if (!body.recipient) {
    errors.push("'recipient' is required.");
  }

  if (!body.sender) {
    errors.push("'sender' is required.");
  }

  if (!body.org_id) {
    errors.push("'org_id' is required.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

module.exports = { validateLogPayload };