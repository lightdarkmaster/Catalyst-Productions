"use strict";
const express = require('express');
const catalyst = require('zcatalyst-sdk-node');
const app = express();
app.use(express.json());

// --- API KEY MIDDLEWARE (all routes) ---
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
        return res.status(401).json({ error: 'Missing x-api-key header' });
    }

    if (apiKey !== process.env.DM_API_KEY) {
        return res.status(403).json({ error: 'Invalid API key' });
    }

    next();
});

app.post("/token", async (req, res) => {
    try {
        const connectorName = 'zoho_crm_connector';

        const clientId     = process.env.ZOHO_CLIENT_ID;
        const clientSecret = process.env.ZOHO_CLIENT_SECRET;
        const authUrl      = process.env.ZOHO_AUTH_URL;
        const refreshUrl   = process.env.ZOHO_REFRESH_URL;
        const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

        const missing = [];
        if (!clientId)     missing.push('ZOHO_CLIENT_ID');
        if (!clientSecret) missing.push('ZOHO_CLIENT_SECRET');
        if (!authUrl)      missing.push('ZOHO_AUTH_URL');
        if (!refreshUrl)   missing.push('ZOHO_REFRESH_URL');
        if (!refreshToken) missing.push('ZOHO_REFRESH_TOKEN');

        if (missing.length > 0) {
            return res.status(500).json({ error: `Missing environment config: ${missing.join(', ')}` });
        }

        const appInstance = catalyst.initialize(req);

        const connector = appInstance.connection({
            [connectorName]: {
                client_id:     clientId,
                client_secret: clientSecret,
                auth_url:      authUrl,
                refresh_url:   refreshUrl,
                refresh_token: refreshToken,
                refresh_in:    '3600'
            }
        }).getConnector(connectorName);

        const accessToken = await connector.getAccessToken();

        res.status(200).json({ access_token: accessToken });

    } catch (err) {
        console.error('Error generating access token:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.all("/", (req, res) => {
    res.status(200).send("I am Live and Ready.");
});

module.exports = app;