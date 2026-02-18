const axios = require("axios");

const API_URL = "http://localhost:5005/api/v1/phone/validate";

async function testPhoneValidation() {
  console.log("--- Testing Phone Validation API ---");

  const testCases = [
    { phone: "9876543210", desc: "Valid 10-digit mobile" },
    { phone: "+919876543210", desc: "Valid +91 mobile" },
    { phone: "1234567890", desc: "Invalid starts with 1" },
    { phone: "987", desc: "Too short" },
    { phone: "", desc: "Empty" },
  ];

  for (const test of testCases) {
    try {
      console.log(`Testing: ${test.desc} (${test.phone})`);
      const response = await axios.post(API_URL, { phone: test.phone });
      console.log("  Status:", response.status);
      console.log("  Response:", response.data);
    } catch (error) {
      if (error.response) {
        console.log("  Status:", error.response.status);
        console.log("  Error:", error.response.data);
      } else {
        console.log("  Error:", error.message);
      }
    }
    console.log("-----------------------------------");
  }
}

testPhoneValidation();
