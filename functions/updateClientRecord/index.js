"use strict";

const express = require("express");
const clientStatusRoutes = require("./routes/clientStatusRoutes");

const app = express();

app.use(express.json());
app.use("/", clientStatusRoutes);

module.exports = app;