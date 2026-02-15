// Function to normalize phone numbers (remove spaces, dashes, parentheses)
const normalizePhone = (phone) => {
  if (!phone) return null;
  return phone.replace(/[^0-9]/g, ""); // Keep only digits
};

const isDuplicate = (existingPhones, newPhone) => {
  if (!newPhone) return false;
  const normalizedNew = normalizePhone(newPhone);

  // Check against all existing normalized phones
  for (let phone of existingPhones) {
    if (normalizePhone(phone) === normalizedNew) {
      return true;
    }
  }
  return false;
};

module.exports = { normalizePhone, isDuplicate };
