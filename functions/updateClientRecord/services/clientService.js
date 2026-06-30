"use strict";

const axios = require("axios");
const catalyst = require("zcatalyst-sdk-node");
const {
  CLIENTS_TABLE_ID,
  CRM_FUNCTION_URL,
  SYNC_CLIENT_PROPERTIES_BASE_URL,
  CRM_SYNC_FIELD_MAP,
} = require("../config/constants");

/**
 * Looks up a client record ROWID by org_id using ZCQL,
 * then applies a partial field update to the Clients DataStore table.
 */
async function updateClientFields(req, orgId, updates, updateSource) {
  const app = catalyst.initialize(req);
  const zcql = app.zcql();
  const table = app.datastore().table(CLIENTS_TABLE_ID);

  const needsSentLookup =
    ("total_viber_credit" in updates || "message_threshold" in updates) &&
    !("total_viber_sent" in updates);

  const selectFields = needsSentLookup
    ? "ROWID, client_org_api_key, total_viber_sent"
    : "ROWID, client_org_api_key";

  const query = `SELECT ${selectFields} FROM Clients WHERE client_org_id = '${orgId}'`;
  const queryResult = await zcql.executeZCQLQuery(query);

  if (!queryResult || queryResult.length === 0) {
    const err = new Error(`No client found with org_id: ${orgId}`);
    err.statusCode = 404;
    throw err;
  }

  const rowId = queryResult[0].Clients.ROWID;
  const clientOrgApiKey = queryResult[0].Clients.client_org_api_key;

  // Auto-calc viber_credit_balance
  if ("total_viber_credit" in updates) {
    const totalViberCredit = Number(updates.total_viber_credit);

    const totalViberSent =
      "total_viber_sent" in updates
        ? Number(updates.total_viber_sent)
        : Number(queryResult[0].Clients.total_viber_sent || 0);

    const calculatedBalance = totalViberCredit - totalViberSent;

    if (!("viber_credit_balance" in updates)) {
      updates.viber_credit_balance = calculatedBalance;

      console.log(
        `[updateClientFields] Auto-calculated viber_credit_balance for org_id ${orgId}:`,
        `${totalViberCredit} - ${totalViberSent} = ${calculatedBalance}`
      );
    }
  }

  // Auto-calc is_message_threshold_reached when message_threshold is being updated
  if ("message_threshold" in updates && !("is_message_threshold_reached" in updates)) {
    const threshold = Number(updates.message_threshold);
    const totalViberSent =
      "total_viber_sent" in updates
        ? Number(updates.total_viber_sent)
        : Number(queryResult[0].Clients.total_viber_sent || 0);

    updates.is_message_threshold_reached = totalViberSent >= threshold ? "ON" : "OFF";

    console.log(
      `[updateClientFields] Auto-set is_message_threshold_reached for org_id ${orgId}:`,
      `sent=${totalViberSent} threshold=${threshold} → ${updates.is_message_threshold_reached}`
    );
  }

  const updatedRow = await table.updateRow({
    ROWID: rowId,
    ...updates,
  });

  // Syncs
  if (updates.trial_status === "has_ended" && updateSource !== "zoho_crm") {
    await syncTrialStatusToCRM(orgId);
  }

  // Build a single client CRM sync payload to avoid double-calling syncClientPropertiesToCRM.
  // - Fields in CRM_SYNC_FIELD_MAP are synced when the update originated from zoho_crm.
  // - is_message_threshold_reached is always synced when present (set explicitly or auto-calc'd).
  const clientCrmSyncPayload = {};

  if (updateSource === "zoho_crm") {
    for (const field of Object.keys(CRM_SYNC_FIELD_MAP)) {
      if (field in updates && field !== "is_message_threshold_reached") {
        clientCrmSyncPayload[field] = updates[field];
      }
    }
  }

  if ("is_message_threshold_reached" in updates) {
    clientCrmSyncPayload.is_message_threshold_reached = updates.is_message_threshold_reached;
  }

  if (Object.keys(clientCrmSyncPayload).length > 0) {
    await syncClientPropertiesToCRM(orgId, clientCrmSyncPayload, clientOrgApiKey);
  }

  return updatedRow;
}

/**
 * DevTac CRM sync (trial status)
 */
async function syncTrialStatusToCRM(orgId) {
  try {
    const payload = {
      org_id: orgId,
      trial_status: "Has Ended",
      update_source: "zoho_catalyst",
    };

    const response = await axios.post(CRM_FUNCTION_URL, payload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.data;
  } catch (err) {
    console.error(
      "CRM sync (trial_status) failed for org_id:",
      orgId,
      err.message
    );
    return null;
  }
}

/**
 * Client CRM sync (Sigma function)
 */
async function syncClientPropertiesToCRM(orgId, updates, clientOrgApiKey) {
  try {
    const syncPayload = {
      org_id: orgId,
      update_source: "zoho_catalyst",
    };

    for (const field of Object.keys(CRM_SYNC_FIELD_MAP)) {
      if (field in updates) {
        syncPayload[field] = updates[field];
      }
    }

    const url =
      SYNC_CLIENT_PROPERTIES_BASE_URL + clientOrgApiKey;

    console.log("Payload:", JSON.stringify(syncPayload));
    console.log("URL:", url);

    const response = await axios.post(url, syncPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(
      `[syncClientPropertiesToCRM] Response for org_id ${orgId}:`,
      response.data
    );

    return response.data;
  } catch (err) {
    console.error(
      "syncClientProperties CRM sync failed for org_id:",
      orgId,
      err.message
    );
    return null;
  }
}

module.exports = { updateClientFields };