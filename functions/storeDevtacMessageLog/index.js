"use strict";

/**
 * index.js
 * Catalyst Serverless Function: storeDevtacMessageLog
 *
 * Exposes an endpoint to store SMS/Viber/WhatsApp delivery logs
 * into the Devtac_Messaging_Logs DataStore table.
 */

const express = require("express");
const catalyst = require("zcatalyst-sdk-node");

const { storeLog } = require("./routes/logRoutes");

const app = express();
app.use(express.json());

/* Attach initialized Catalyst app to every request */
app.use((req, _res, next) => {
  req.catalystApp = catalyst.initialize(req);
  next();
});

/* ── Routes ────────────────────────────────────────────────────────────── */

app.post("/storeLog", storeLog);

/* ── Export ─────────────────────────────────────────────────────────────── */

module.exports = app;