const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const ENCODING = "hex";

function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required");
  }
  // Derive a 32-byte key from the provided key using SHA-256
  return crypto.createHash("sha256").update(key).digest();
}

/**
 * Encrypt plaintext using AES-256-GCM (authenticated encryption).
 * Returns a string in the format: iv:authTag:ciphertext (all hex-encoded).
 */
function encrypt(plaintext) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", ENCODING);
  encrypted += cipher.final(ENCODING);
  const tag = cipher.getAuthTag();

  return `${iv.toString(ENCODING)}:${tag.toString(ENCODING)}:${encrypted}`;
}

/**
 * Decrypt ciphertext produced by encrypt().
 * Expects format: iv:authTag:ciphertext (all hex-encoded).
 */
function decrypt(encryptedData) {
  const key = getEncryptionKey();
  const parts = encryptedData.split(":");

  if (parts.length !== 3) {
    throw new Error("Invalid encrypted data format");
  }

  const iv = Buffer.from(parts[0], ENCODING);
  const tag = Buffer.from(parts[1], ENCODING);
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, ENCODING, "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

module.exports = { encrypt, decrypt };
