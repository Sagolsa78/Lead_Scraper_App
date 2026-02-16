const sheetsConfig = require("../config/sheets");
const logger = require("../config/logger");

const HEADERS = [
  "Business Name",
  "Address",
  "Phone",
  "Rating",
  "Website",
  "Google Maps URL",
  "Date Added",
  "Business Type",
  "City",
];

const ensureSheetExists = async () => {
  try {
    const spreadsheet = await sheetsConfig.sheets.spreadsheets.get({
      spreadsheetId: sheetsConfig.spreadsheetId,
    });

    const sheetExists = spreadsheet.data.sheets.some(
      (sheet) => sheet.properties.title === "Leads",
    );

    if (!sheetExists) {
      logger.info("Sheet 'Leads' not found. Creating it...");
      await sheetsConfig.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetsConfig.spreadsheetId,
        resource: {
          requests: [{ addSheet: { properties: { title: "Leads" } } }],
        },
      });
      logger.info("Sheet 'Leads' created successfully.");
      return true;
    }
    return false;
  } catch (error) {
    logger.error(`Error ensuring sheet exists: ${error.message}`);
    throw error;
  }
};

const initializeHeaders = async () => {
  try {
    const response = await sheetsConfig.sheets.spreadsheets.values.get({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: "Leads!A1:I1",
    });

    if (!response.data.values || response.data.values.length === 0) {
      logger.info("Initializing headers for 'Leads' sheet...");
      await sheetsConfig.sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: "Leads!A1:I1",
        valueInputOption: "USER_ENTERED",
        resource: { values: [HEADERS] },
      });
      logger.info("Headers initialized.");
    }
  } catch (error) {
    logger.error(`Error initializing headers: ${error.message}`);
    throw error;
  }
};

const appendLeads = async (leads, metadata = {}) => {
  if (leads.length === 0) return 0;

  try {
    await ensureSheetExists();
    await initializeHeaders();

    const rows = leads.map((lead) => [
      lead.name,
      lead.formatted_address,
      lead.formatted_phone_number,
      lead.rating || "N/A",
      lead.website || "N/A",
      lead.url,
      new Date().toISOString(),
      metadata.businessType || "N/A",
      metadata.city || "N/A",
    ]);

    await sheetsConfig.sheets.spreadsheets.values.append({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: "Leads!A1",
      valueInputOption: "USER_ENTERED",
      resource: { values: rows },
    });

    logger.info(`Successfully appended ${leads.length} leads to Google Sheets`);
    return leads.length;
  } catch (error) {
    logger.error(`Error writing to Google Sheets: ${error.message}`);
    throw error;
  }
};

module.exports = { appendLeads, ensureSheetExists };
