"use strict";

const CLIENTS_TABLE_ID = "28025000000212052";

const CRM_FUNCTION_URL =
  "https://www.zohoapis.com/crm/v7/functions/devtacmessagingupdateclientrecord/actions/execute?auth_type=apikey&zapikey=1003.b652f9a9fedf93a6219972379b688df8.53d896f4366140d8fc39e34a86b87899";

/**
 * Base URL for the syncClientProperties Sigma function.
 * The client's client_org_api_key (fetched from the Clients DataStore table)
 * is appended as the zapikey value at runtime, since each client has their own key.
 */
const SYNC_CLIENT_PROPERTIES_BASE_URL =
  "https://www.zohoapis.com/crm/v7/functions/devtacmessaging__syncclientproperties/actions/execute?auth_type=apikey&zapikey=";

/**
 * Whitelist of fields allowed to be updated via this function.
 * Identity fields (client_org_id, client_org_name, client_org_admin_email, license_key) are excluded.
 */
const ALLOWED_UPDATE_FIELDS = [
  "status",
  "total_viber_credit",
  "total_viber_sent",
  "viber_credit_balance",
  "m360_client_id",
  "m360_client_secret",
  "sender_id",
  "message_threshold",
  "trial_status",
  "client_org_api_key",
  "is_message_threshold_reached",
];

/**
 * Fields that are synced to the client's Zoho CRM via syncClientProperties.
 * Mapped as: DataStore field -> CRM API name.
 */
const CRM_SYNC_FIELD_MAP = {
  viber_credit_balance: "devtacmessaging__Viber_Credit_Balance",
  trial_status: "devtacmessaging__Trial_Status",
  is_message_threshold_reached: "devtacmessaging__Is_Message_Threshold_Reached",
};

module.exports = {
  CLIENTS_TABLE_ID,
  CRM_FUNCTION_URL,
  SYNC_CLIENT_PROPERTIES_BASE_URL,
  CRM_SYNC_FIELD_MAP,
  ALLOWED_UPDATE_FIELDS,
};