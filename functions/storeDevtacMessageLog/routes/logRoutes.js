/**
 * routes/logRoutes.js
 * Route handler for message log endpoints
 */

const { validateLogPayload } = require("../utils/validator");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const { insertMessageLog } = require("../services/datastoreService");
const { HTTP_STATUS } = require("../config/constants");

/**
 * POST /log
 * Stores a message delivery log entry into Devtac_Messaging_Logs.
 *
 * Expected body:
 * {
 *   org_id:              string                            [required]
 *   channel:             "SMS" | "Viber" | "WhatsApp"      [required]
 *   message_status:      "success" | "failed" | "pending"  [required]
 *   sender:              string                            [required]
 *   recipient:           string                            [required]
 *   status_code:         string                            [optional]
 *   error_code:          string                            [required if failed]
 *   error_description:   string                            [required if failed]
 *   request_id:          string                            [optional]
 *   telco_id:            string                            [optional]
 *   message_count:       number                            [optional]
 * }
 */
async function storeLog(req, res) {
  const catalystApp = req.catalystApp;
  const body = req.body;

  const { valid, errors } = validateLogPayload(body);
  if (!valid) {
    return sendError(res, errors, HTTP_STATUS.BAD_REQUEST);
  }

  try {
    const insertedRow = await insertMessageLog(catalystApp, body);
    return sendSuccess(res, {
      message: "Log entry stored successfully.",
      rowid: insertedRow.ROWID,
    });
  } catch (err) {
    console.error("[storeLog] DataStore insert error:", err);
    return sendError(res, "Failed to store log entry. Please try again.");
  }
}

module.exports = { storeLog };