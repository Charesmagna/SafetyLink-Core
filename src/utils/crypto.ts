/**
 * SafetyLink Client-Side Cryptographic Utilities
 * Provides Zero-Knowledge encryption and decryption for files using Web Crypto AES-GCM (256-bit)
 * with PBKDF2 key derivation (SHA-256, 100,000 iterations).
 */

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as any,
      iterations: 100000,
      hash: "SHA-256"
    },
    passwordKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts an ArrayBuffer of file data using the provided master password.
 */
export async function encryptFileData(
  fileData: ArrayBuffer,
  password: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);
  
  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    fileData
  );

  // Convert encrypted ArrayBuffer to base64
  const uint8Encrypted = new Uint8Array(encrypted);
  let binary = "";
  for (let i = 0; i < uint8Encrypted.length; i++) {
    binary += String.fromCharCode(uint8Encrypted[i]);
  }
  const ciphertextBase64 = window.btoa(binary);

  // Convert IV and salt to base64
  const ivBase64 = window.btoa(String.fromCharCode(...iv));
  const saltBase64 = window.btoa(String.fromCharCode(...salt));

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
    salt: saltBase64
  };
}

/**
 * Decrypts a base64 ciphertext using the master password and cryptographic salt/IV parameters.
 */
export async function decryptFileData(
  ciphertextBase64: string,
  ivBase64: string,
  saltBase64: string,
  password: string
): Promise<ArrayBuffer> {
  const binaryCipher = window.atob(ciphertextBase64);
  const encryptedData = new Uint8Array(binaryCipher.length);
  for (let i = 0; i < binaryCipher.length; i++) {
    encryptedData[i] = binaryCipher.charCodeAt(i);
  }

  const binaryIv = window.atob(ivBase64);
  const iv = new Uint8Array(binaryIv.length);
  for (let i = 0; i < binaryIv.length; i++) {
    iv[i] = binaryIv.charCodeAt(i);
  }

  const binarySalt = window.atob(saltBase64);
  const salt = new Uint8Array(binarySalt.length);
  for (let i = 0; i < binarySalt.length; i++) {
    salt[i] = binarySalt.charCodeAt(i);
  }

  const key = await deriveKey(password, salt);
  return await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv
    },
    key,
    encryptedData
  );
}
