"use strict";
const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const app = express();
app.use(express.json());

const CHANNELS = ['sms', 'viber', 'whatsapp'];

const CHANNEL_COLUMNS = {
    sms: {
        license_key:                    'sms_license_key',
        extension_status:               'sms_extension_status',
        extension_status_description:   'sms_extension_status_description',
        trial_status:                   'sms_trial_status',
        total_credit:                   'sms_total_credit',
        total_sent:                     'sms_total_sent',
        credit_balance:                 'sms_credit_balance',
        message_threshold:              'sms_message_threshold',
        is_message_threshold_reached:   'sms_is_message_threshold_reached',
        sender_id:                      'sms_sender_id'
    },
    viber: {
        license_key:                    'viber_license_key',
        extension_status:               'viber_extension_status',
        extension_status_description:   'viber_extension_status_description',
        trial_status:                   'viber_trial_status',
        total_credit:                   'viber_total_credit',
        total_sent:                     'viber_total_sent',
        credit_balance:                 'viber_credit_balance',
        message_threshold:              'viber_message_threshold',
        is_message_threshold_reached:   'viber_is_message_threshold_reached',
        sender_id:                      'viber_sender_id'
    },
    whatsapp: {
        license_key:                    'whatsapp_license_key',
        extension_status:               'whatsapp_extension_status',
        extension_status_description:   'whatsapp_extension_status_description',
        trial_status:                   'whatsapp_trial_status',
        total_credit:                   'whatsapp_total_credit',
        total_sent:                     'whatsapp_total_sent',
        credit_balance:                 'whatsapp_credit_balance',
        message_threshold:              'whatsapp_message_threshold',
        is_message_threshold_reached:   'whatsapp_is_message_threshold_reached',
        sender_id:                      'whatsapp_sender_id'
    }
};

function generateLicenseKey() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = [];
    for (let s = 0; s < 8; s++) {
        let seg = '';
        for (let i = 0; i < 8; i++) {
            seg += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        segments.push(seg);
    }
    return 'DM-' + segments.join('-');
}

app.post("/clients", async (req, res) => {
    try {
        const {
            client_org_id,
            client_org_name,
            client_org_email,
            client_org_api_key,
            channel,
            message_threshold
        } = req.body;

        // --- DEFAULT zoho_app TO "crm" IF MISSING OR EMPTY ---
        const zoho_app = (req.body.zoho_app && req.body.zoho_app.trim() !== '')
            ? req.body.zoho_app.trim()
            : 'crm';

        // --- VALIDATE REQUIRED FIELDS ---
        const missing = [];
        if (!client_org_id)      missing.push('client_org_id');
        if (!client_org_name)    missing.push('client_org_name');
        if (!client_org_email)   missing.push('client_org_email');
        if (!client_org_api_key) missing.push('client_org_api_key');
        if (!channel)            missing.push('channel');

        if (missing.length > 0) {
            return res.status(400).json({
                status:  'failure',
                message: `Missing required fields: ${missing.join(', ')}`
            });
        }

        const channelKey = channel.toLowerCase();
        const activeCols = CHANNEL_COLUMNS[channelKey];
        if (!activeCols) {
            return res.status(400).json({
                status:  'failure',
                message: `Unsupported channel: ${channel}`
            });
        }

        const catalystApp = catalyst.initialize(req, { type: catalyst.type.applogic });
        const tableId     = process.env.TABLE_ID;
        const table       = catalystApp.datastore().table(tableId);
        const zcql        = catalystApp.zcql();

        // --- CHECK IF CLIENT ALREADY EXISTS FOR THIS ORG + ZOHO APP ---
        const checkResult = await zcql.executeZCQLQuery(
            `SELECT ROWID, zoho_app,
                ${CHANNELS.map(ch => CHANNEL_COLUMNS[ch].trial_status).join(', ')},
                ${CHANNELS.map(ch => CHANNEL_COLUMNS[ch].credit_balance).join(', ')},
                ${CHANNELS.map(ch => CHANNEL_COLUMNS[ch].license_key).join(', ')}
            FROM Clients
            WHERE client_org_id = '${client_org_id}'
            AND zoho_app = '${zoho_app}'`
        );

        if (checkResult && checkResult.length > 0) {
            // --- RECORD EXISTS: ACTIVATE THIS CHANNEL, PRESERVE EXISTING LICENSE KEY IF SET ---
            const existingRow        = checkResult[0].Clients;
            const rowId              = existingRow['ROWID'];
            const wasInactive        = existingRow[activeCols.trial_status] === 'inactive';
            const existingLicenseKey = existingRow[activeCols.license_key];

            // Only generate a new key if there isn't one stored already
            const licenseKey = (existingLicenseKey && existingLicenseKey.trim() !== '')
                ? existingLicenseKey
                : generateLicenseKey();

            const senderIdEnvKey = `${channelKey.toUpperCase()}_DEFAULT_SENDER_ID`;

            const updatePayload = {
                ROWID:                         rowId,
                [activeCols.extension_status]: 'active',
                [activeCols.trial_status]:     'active',
            };

            // Only write license_key to datastore if it was freshly generated
            if (!existingLicenseKey || existingLicenseKey.trim() === '') {
                updatePayload[activeCols.license_key] = licenseKey;
            }

            if (wasInactive) {
                updatePayload[activeCols.total_credit]   = 8;
                updatePayload[activeCols.credit_balance] = 8;
            }

            await table.updateRow(updatePayload);

            console.log(`Updated ${channelKey} extension to active for client: ${client_org_id} (${zoho_app})`);

            return res.status(200).json({
                status:                            'updated',
                message:                           `${channelKey} extension activated for existing client`,
                client_org_id:                     client_org_id,
                zoho_app:                          zoho_app,
                channel:                           channelKey,
                trial_status:                      'active',
                credit_balance:                    wasInactive ? 8 : existingRow[activeCols.credit_balance],
                [`${channelKey}_license_key`]:     licenseKey,
                [`${channelKey}_sender_id`]:       process.env[senderIdEnvKey]
            });
        }

        // --- NEW CLIENT: GENERATE KEY ONLY FOR THE INSTALLING CHANNEL ---
        const licenseKey     = generateLicenseKey();
        const senderIdEnvKey = `${channelKey.toUpperCase()}_DEFAULT_SENDER_ID`;

        const newRow = {
            client_org_id:          client_org_id,
            client_org_name:        client_org_name,
            client_org_admin_email: client_org_email,
            client_org_api_key:     client_org_api_key,
            zoho_app:               zoho_app,
            m360_client_id:         process.env.M360_CLIENT_ID,
            m360_client_secret:     process.env.M360_CLIENT_SECRET,
        };

        for (const ch of CHANNELS) {
            const cols     = CHANNEL_COLUMNS[ch];
            const isActive = ch === channelKey;

            newRow[cols.extension_status]             = isActive ? 'active'  : 'inactive';
            newRow[cols.trial_status]                 = isActive ? 'active'  : 'inactive';
            newRow[cols.total_credit]                 = isActive ? 8         : 0;
            newRow[cols.total_sent]                   = 0;
            newRow[cols.credit_balance]               = isActive ? 8         : 0;
            newRow[cols.message_threshold]            = message_threshold || 10000;
            newRow[cols.is_message_threshold_reached] = 'OFF';

            if (isActive) {
                newRow[cols.license_key] = licenseKey;
                newRow[cols.sender_id]   = process.env[senderIdEnvKey];
            }
            // inactive channels: license_key and sender_id left null until their channel is installed
        }

        const row = await table.insertRow(newRow);
        console.log('Client record created:', JSON.stringify(row));

        return res.status(200).json({
            status:                            'created',
            message:                           `Client record created with ${channelKey} extension active`,
            client_org_id:                     client_org_id,
            zoho_app:                          zoho_app,
            channel:                           channelKey,
            trial_status:                      'active',
            credit_balance:                    8,
            [`${channelKey}_license_key`]:     licenseKey,
            [`${channelKey}_sender_id`]:       process.env[senderIdEnvKey]
        });

    } catch (err) {
        console.error('Error in /clients:', err.message);
        res.status(500).json({
            status:  'failure',
            message: err.message
        });
    }
});

module.exports = app;