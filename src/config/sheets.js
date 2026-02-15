require("dotenv").config();
const { google } = require("googleapis");

const serviceAccountAuth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

const sheets = google.sheets({ version: "v4", auth: serviceAccountAuth });

const sheetsConfig = {
  spreadsheetId: process.env.GOOGLE_SHEET_ID,
  sheets,
};

module.exports = sheetsConfig;
