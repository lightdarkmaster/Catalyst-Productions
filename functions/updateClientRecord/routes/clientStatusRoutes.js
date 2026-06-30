"use strict";

const express = require("express");
const router = express.Router();

const { validateUpdateRequest } = require("../utils/validator");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const clientService = require("../services/clientService");

/**
 * PATCH /updateRecord
 *
 * Partially updates one or more fields on a Clients DataStore record.
 *
 * Request body:
 * {
 *   "org_id": "string",           // required
 *   "update_source": "zoho_crm",  // optional — used to prevent sync loops
 *   "status": "inactive",         // optional — any field from ALLOWED_UPDATE_FIELDS
 *   "trial_status": "has_ended",  // optional
 *   ...
 * }
 */
router.patch("/updateRecord", async (req, res) => {
  // Log only relevant properties to avoid circular reference error
  const { isValid, error, updates, updateSource } = validateUpdateRequest(req.body);

  if (!isValid) {
    return sendError(res, error, 400);
  }

  const { org_id } = req.body;

  try {
    const updatedRow = await clientService.updateClientFields(req, org_id, updates, updateSource);

    return sendSuccess(res, {
      message: "Client record updated successfully",
      org_id,
      updated_fields: Object.keys(updates),
      row: updatedRow,
    });
  } catch (err) {
    const statusCode = err.statusCode || 500;
    return sendError(res, err.message, statusCode);
  }
});

module.exports = router;