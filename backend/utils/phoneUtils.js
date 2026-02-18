/**
 * Normalizes an Indian phone number to E.164 format (+91XXXXXXXXXX).
 * Returns null if the number is invalid or not an Indian mobile number.
 *
 * @param {string} number - The phone number to normalize.
 * @returns {string|null} - Normalized number or null.
 */
function normalizeIndianNumber(number) {
  if (!number) return null;

  // Remove all non-digit characters
  let cleaned = number.replace(/\D/g, "");

  // specific logic for numbers starting with '0'
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Case 1: 10 digits, starts with 6-9
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return "+91" + cleaned;
  }

  // Case 2: 12 digits, starts with 91, then 6-9
  if (
    cleaned.length === 12 &&
    cleaned.startsWith("91") &&
    /^[6-9]/.test(cleaned.substring(2))
  ) {
    return "+" + cleaned;
  }

  return null;
}

module.exports = { normalizeIndianNumber };
