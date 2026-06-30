"use strict";

const { ALLOWED_UPDATE_FIELDS } = require("../config/constants");

/**
 * Validates the incoming update request payload.
 *
 * Expected shape:
 * {
 *   "org_id": "12345",          // required - used to look up the client record
 *   "update_source": "zoho_crm" // optional - indicates origin, not a DataStore field
 *   "field_name": value,        // one or more fields from the ALLOWED_UPDATE_FIELDS list
 *   ...
 * }
 *
 * @param {object} body - Request body
 * @returns {{ isValid: boolean, error?: string, updates?: object, updateSource?: string }}
 */
function validateUpdateRequest(body) {
  const { org_id, update_source, ...rest } = body;
    console.log(org_id);
  if (!org_id || typeof org_id !== "string" || !org_id.trim()) {
    return { isValid: false, error: "Missing or invalid required field: org_id" };
  }

  const updates = {};
  const invalidFields = [];

  for (const [key, value] of Object.entries(rest)) {
    if (!ALLOWED_UPDATE_FIELDS.includes(key)) {
      invalidFields.push(key);
    } else {
      updates[key] = value;
    }
  }

  if (invalidFields.length > 0) {
    return {
      isValid: false,
      error: `Unrecognized or non-updatable fields: ${invalidFields.join(", ")}`,
    };
  }

  if (Object.keys(updates).length === 0) {
    return { isValid: false, error: "No valid update fields provided" };
  }

  return { isValid: true, updates, updateSource: update_source || null };
}

module.exports = { validateUpdateRequest };