const sheetsConfig = require("../config/sheets");
console.log("DEBUG: sheetsService.js loaded - verify version");

const HEADERS = [
  "Business Name",
  "Address",
  "Phone",
  "Rating",
  "Website",
  "Google Maps URL",
  "Date Added",
  "BuisnessType",
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
      console.log("Sheet 'Leads' not found. Creating it...");
      await sheetsConfig.sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetsConfig.spreadsheetId,
        resource: {
          requests: [
            {
              addSheet: {
                properties: {
                  title: "Leads",
                },
              },
            },
          ],
        },
      });
      console.log("Sheet 'Leads' created successfully.");
      return true; // Sheet was just created
    }
    return false; // Sheet already existed
  } catch (error) {
    console.error("Error ensuring sheet exists:", error.message);
    throw error;
  }
};

const checkAndInitializeSheet = async () => {
  try {
    const justCreated = await ensureSheetExists();

    if (justCreated) {
      console.log("Initializing headers for new sheet...");
      await sheetsConfig.sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: "Leads!A1:G1",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [HEADERS],
        },
      });
      return;
    }

    // Check if the sheet has any data in the header row
    const response = await sheetsConfig.sheets.spreadsheets.values.get({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: "Leads!A1:G1",
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("Sheet is empty. Initializing headers...");
      await sheetsConfig.sheets.spreadsheets.values.update({
        spreadsheetId: sheetsConfig.spreadsheetId,
        range: "Leads!A1:G1",
        valueInputOption: "USER_ENTERED",
        resource: {
          values: [HEADERS],
        },
      });
      console.log("Headers initialized.");
    }
  } catch (error) {
    console.error("Error checking/initializing sheet:", error.message);
    throw error;
  }
};

const getExistingPhones = async () => {
  try {
    // Ensure sheet is initialized before reading
    await checkAndInitializeSheet();

    const response = await sheetsConfig.sheets.spreadsheets.values.get({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: "Leads!C:C", // Assuming Phone is in Column C
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return new Set();
    }

    // Flatten array and remove header if present (assuming first row is header)
    const phones = rows.flat().filter((phone) => phone !== "Phone");
    return new Set(phones);
  } catch (error) {
    console.error("Error reading from Sheets:", error.message);
    throw error;
  }
};

const appendLeads = async (leads) => {
  if (leads.length === 0) return 0;

  try {
    // Ensure sheet is initialized before appending
    await checkAndInitializeSheet();

    const rows = leads.map((lead) => [
      lead.name,
      lead.formatted_address,
      lead.formatted_phone_number,
      lead.rating || "N/A",
      lead.website || "N/A",
      lead.url,
      new Date().toISOString().split("T")[0], // Date Added
    ]);

    await sheetsConfig.sheets.spreadsheets.values.append({
      spreadsheetId: sheetsConfig.spreadsheetId,
      range: "Leads!A:G",
      valueInputOption: "USER_ENTERED",
      resource: {
        values: rows,
      },
    });

    return leads.length;
  } catch (error) {
    console.error("Error appending to Sheets:", error.message);
    throw error;
  }
};

module.exports = {
  getExistingPhones,
  appendLeads,
  checkAndAddHeaders: checkAndInitializeSheet,
};
