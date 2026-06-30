/**
 * services/datastoreService.js
 * Handles all Catalyst DataStore operations for Devtac_Messaging_Logs
 */

/**
 * Builds the row object to be inserted into Devtac_Messaging_Logs.
 * Only maps fields present in the payload; undefined fields are omitted
 * so Catalyst uses its column defaults.
 *
 * @param {Object} payload - Validated request body
 * @returns {Object} - DataStore row object
 */
function buildLogRow(payload) {
  const row = {
    channel: payload.channel,
    message_status: payload.message_status,
    sender: payload.sender,
    recipient: payload.recipient,
    client_org_id: payload.org_id,
    direction: payload.direction
  };

  /* Optional fields — included only when provided */
  if (payload.status_code !== undefined) row.status_code = String(payload.status_code);
  if (payload.error_code !== undefined) row.error_code = payload.error_code;
  if (payload.error_description !== undefined) row.error_description = payload.error_description;
  if (payload.request_id !== undefined) row.request_id = payload.request_id;
  if (payload.telco_id !== undefined) row.telco_id = payload.telco_id;
  if (payload.message_count !== undefined) row.message_count = Number(payload.message_count);
  if (payload.segment_count !== undefined) row.segment_count = Number(payload.segment_count);

  return row;
}

/**
 * Inserts a single log record into Devtac_Messaging_Logs via Catalyst DataStore.
 *
 * @param {Object} catalystApp - Initialized Catalyst app instance
 * @param {Object} payload - Validated request body
 * @returns {Promise<Object>} - Inserted row response from Catalyst
 */
async function insertMessageLog(catalystApp, payload) {
  const datastore = catalystApp.datastore();
  const table = datastore.table(process.env.TABLE_ID);
  const row = buildLogRow(payload);

  const result = await table.insertRow(row);
  return result;
}

module.exports = { insertMessageLog };