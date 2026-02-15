const express = require("express");
const leadRoutes = require("./routes/leadRoutes");
const errorHandler = require("./utils/errorHandler");

const app = express();

app.use(express.json());

// Routes
app.use("/", leadRoutes);

// Error Handler
app.use(errorHandler);

module.exports = app;
