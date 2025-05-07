// This is a simplified cryptography service using the Web Crypto API
// In a real-world app, you would want a more robust implementation

/**
 * Generate RSA key pair for encryption/decryption
 * @returns {Promise<{publicKey: string, privateKey: string}>} - Key pair as JWK strings
 */
async function generateKeyPair() {
  try {
    // Generate RSA key pair
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true, // extractable
      ["encrypt", "decrypt"] // key usage
    );
    
    // Export public key to JWK
    const publicKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.publicKey
    );
    
    // Export private key to JWK - Note: This is sensitive and should be stored securely
    const privateKeyJwk = await window.crypto.subtle.exportKey(
      "jwk",
      keyPair.privateKey
    );
    
    return {
      publicKey: JSON.stringify(publicKeyJwk),
      privateKey: JSON.stringify(privateKeyJwk)
    };
  } catch (error) {
    console.error('Error generating key pair:', error);
    throw new Error('Failed to generate encryption keys');
  }
}

/**
 * Import public key from JWK string
 * @param {string} jwkString - Public key as a JWK string
 * @returns {Promise<CryptoKey>} - CryptoKey object
 */
async function importPublicKey(jwkString) {
  try {
    console.log('Importing public key, raw string:', jwkString);
    const jwk = JSON.parse(jwkString);
    console.log('Parsed JWK:', jwk);
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  } catch (error) {
    console.error('Error importing public key:', error);
    throw new Error('Failed to import public key');
  }
}

/**
 * Import private key from JWK string
 * @param {string} jwkString - Private key as a JWK string
 * @returns {Promise<CryptoKey>} - CryptoKey object
 */
async function importPrivateKey(jwkString) {
  try {
    const jwk = JSON.parse(jwkString);
    return await window.crypto.subtle.importKey(
      "jwk",
      jwk,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"]
    );
  } catch (error) {
    console.error('Error importing private key:', error);
    throw new Error('Failed to import private key');
  }
}

/**
 * Encrypt data with a public key
 * @param {string} data - Data to encrypt
 * @param {string} publicKeyJwk - Public key as a JWK string
 * @returns {Promise<string>} - Encrypted data as base64 string
 */
async function encryptWithPublicKey(data, publicKeyJwk) {
  try {
    console.log('Public key before import:', publicKeyJwk);
    const publicKey = await importPublicKey(publicKeyJwk);
    
    // Convert data to ArrayBuffer
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    // Encrypt data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      publicKey,
      dataBuffer
    );
    
    // Convert encrypted data to base64
    return bufferToBase64(encryptedBuffer);
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data with a private key
 * @param {string} encryptedData - Encrypted data as base64 string
 * @param {string} privateKeyJwk - Private key as a JWK string
 * @returns {Promise<string>} - Decrypted data
 */
async function decryptWithPrivateKey(encryptedData, privateKeyJwk) {
  try {
    const privateKey = await importPrivateKey(privateKeyJwk);
    
    // Convert base64 to ArrayBuffer
    const encryptedBuffer = base64ToBuffer(encryptedData);
    
    // Decrypt data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP"
      },
      privateKey,
      encryptedBuffer
    );
    
    // Convert decrypted data to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Convert ArrayBuffer to base64 string
 * @param {ArrayBuffer} buffer - ArrayBuffer to convert
 * @returns {string} - Base64 string
 */
function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string to convert
 * @returns {ArrayBuffer} - ArrayBuffer
 */
function base64ToBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Securely store private key in localStorage (encrypted with user's password)
 * @param {string} privateKey - Private key as JWK string
 * @param {string} password - User's password
 * @returns {Promise<void>}
 */
async function storePrivateKey(privateKey, password) {
  try {
    // Generate a random salt (16 bytes)
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Convert password to key using PBKDF2
    const passwordEncoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      "raw",
      passwordEncoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    // Derive an AES-GCM key from the password
    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["encrypt", "decrypt"]
    );
    
    // Generate a random IV (12 bytes)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the private key
    const encoder = new TextEncoder();
    const privateKeyBuffer = encoder.encode(privateKey);
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv
      },
      aesKey,
      privateKeyBuffer
    );
    
    // Create a storage object with all the necessary components
    const storageObject = {
      salt: bufferToBase64(salt),
      iv: bufferToBase64(iv),
      encryptedPrivateKey: bufferToBase64(encryptedData)
    };
    
    // Store as JSON in localStorage
    localStorage.setItem('securePrivateKey', JSON.stringify(storageObject));
  } catch (error) {
    console.error('Error storing private key:', error);
    throw new Error('Failed to securely store private key');
  }
}

/**
 * Retrieve private key from localStorage and decrypt with user's password
 * @param {string} password - User's password
 * @returns {Promise<string|null>} - Private key as JWK string or null if retrieval fails
 */
async function retrievePrivateKey(password) {
  try {
    // Get encrypted data from localStorage
    const storedData = localStorage.getItem('securePrivateKey');
    if (!storedData) {
      return null;
    }
    
    // Parse the storage object
    const storageObject = JSON.parse(storedData);
    const salt = base64ToBuffer(storageObject.salt);
    const iv = base64ToBuffer(storageObject.iv);
    const encryptedData = base64ToBuffer(storageObject.encryptedPrivateKey);
    
    // Convert password to key using PBKDF2
    const passwordEncoder = new TextEncoder();
    const passwordKey = await window.crypto.subtle.importKey(
      "raw",
      passwordEncoder.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveKey"]
    );
    
    // Derive the same AES-GCM key from the password and stored salt
    const aesKey = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: salt,
        iterations: 100000,
        hash: "SHA-256"
      },
      passwordKey,
      {
        name: "AES-GCM",
        length: 256
      },
      false,
      ["encrypt", "decrypt"]
    );
    
    // Decrypt the private key
    try {
      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        aesKey,
        encryptedData
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedData);
    } catch (decryptError) {
      // Decryption failed - likely wrong password
      console.error('Decryption failed - incorrect password:', decryptError);
      return null;
    }
  } catch (error) {
    console.error('Error retrieving private key:', error);
    return null;
  }
}

export {
  generateKeyPair,
  encryptWithPublicKey,
  decryptWithPrivateKey,
  storePrivateKey,
  retrievePrivateKey
}; 