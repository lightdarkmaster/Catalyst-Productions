/**
 * config/constants.js
 * Application-wide constants for sendMessageRequestToProvider
 */

const CHANNELS = {
  SMS: "SMS",
  VIBER: "Viber",
  WHATSAPP: "WhatsApp",
};

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_IMPLEMENTED: 501,
  INTERNAL_ERROR: 500,
};

/* ── M360 One API ─────────────────────────────────────────────────────────── */
const M360 = {
  SMS_ENDPOINT: "https://api.m360.com.ph/v4/viber/send",
  /**
   * app_key and app_secret are read from the Clients DataStore record per org.
   * Fields: m360_client_id, m360_client_secret
   */
  DEFAULT_DCS: parseInt(process.env.DEFAULT_DCS, 10) || 0,
};

/* ── Catalyst DataStore Table IDs ─────────────────────────────────────────── */
const TABLES = {
  CLIENTS: "28025000000212052",
};

/* ── Trial config ─────────────────────────────────────────────────────────── */
/**
 * TRIAL_SENDER_ID is set as a Catalyst environment variable so it can be
 * changed per environment (Development / Production) without a code deploy.
 * Falls back to an empty string — getClientByOrgId will throw before we
 * ever reach the provider if sender_id is blank.
 */
const TRIAL = {
  SENDER_ID: process.env.TRIAL_SENDER_ID || "",
};

module.exports = {
  CHANNELS,
  HTTP_STATUS,
  M360,
  TABLES,
  TRIAL,
};