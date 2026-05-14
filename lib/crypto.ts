const RSA_ALG = { name: "RSA-OAEP", hash: "SHA-256" } as const;
const AES_ALG = "AES-GCM" as const;
const AES_KEY_LENGTH = 256;
const GCM_IV_BYTES = 12;

export interface EncryptedEnvelope {
  /** base64: RSA-OAEP(raw AES-256 session key, serverPublicKey) */
  encryptedKey: string;
  /** base64: iv[12] || AES-GCM ciphertext */
  payload: string;
}

export interface EncryptedResponse {
  /** base64: iv[12] || AES-GCM ciphertext */
  payload: string;
}

function toBase64(data: ArrayBuffer | Uint8Array): string {
  const bytes = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  return btoa(String.fromCharCode(...bytes));
}

function fromBase64(b64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function pemToBuffer(pem: string): ArrayBuffer {
  const base64 = pem
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN.*?-----/g, "")
    .replace(/-----END.*?-----/g, "")
    .replace(/\s/g, "");
  return fromBase64(base64).buffer as ArrayBuffer;
}

function sealWithIv(iv: Uint8Array, ciphertext: ArrayBuffer): string {
  const sealed = new Uint8Array(GCM_IV_BYTES + ciphertext.byteLength);
  sealed.set(iv, 0);
  sealed.set(new Uint8Array(ciphertext), GCM_IV_BYTES);
  return toBase64(sealed);
}

function unsealWithIv(payload: string): { iv: Uint8Array<ArrayBuffer>; ciphertext: ArrayBuffer } {
  const raw = fromBase64(payload);
  return {
    iv: raw.slice(0, GCM_IV_BYTES),
    ciphertext: raw.slice(GCM_IV_BYTES).buffer as ArrayBuffer,
  };
}

async function importPublicKey(pem: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey("spki", pemToBuffer(pem), RSA_ALG, false, ["encrypt"]);
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey("pkcs8", pemToBuffer(pem), RSA_ALG, false, ["decrypt"]);
}

async function importAesKey(raw: ArrayBuffer, usages: KeyUsage[]): Promise<CryptoKey> {
  return globalThis.crypto.subtle.importKey(
    "raw",
    raw,
    { name: AES_ALG, length: AES_KEY_LENGTH },
    false,
    usages
  );
}

/**
 * Client — encrypt a plaintext string for the server.
 *
 * Generates a fresh AES-GCM session key, wraps it with the server's RSA-OAEP
 * public key, and encrypts the plaintext with AES-GCM (IV prepended to ciphertext).
 *
 * The returned `sessionKey` must be kept in memory to decrypt the server's response.
 */
export async function encryptRequest(
  plaintext: string,
  publicKeyPem: string
): Promise<{ envelope: EncryptedEnvelope; sessionKey: CryptoKey }> {
  const [publicKey, sessionKey] = await Promise.all([
    importPublicKey(publicKeyPem),
    globalThis.crypto.subtle.generateKey({ name: AES_ALG, length: AES_KEY_LENGTH }, true, [
      "encrypt",
      "decrypt",
    ]),
  ]);

  const rawSessionKey = await globalThis.crypto.subtle.exportKey("raw", sessionKey);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
  const encoded = new Uint8Array(new TextEncoder().encode(plaintext));

  const [encryptedKey, encryptedPayload] = await Promise.all([
    globalThis.crypto.subtle.encrypt(RSA_ALG, publicKey, rawSessionKey),
    globalThis.crypto.subtle.encrypt({ name: AES_ALG, iv }, sessionKey, encoded),
  ]);

  return {
    envelope: {
      encryptedKey: toBase64(encryptedKey),
      payload: sealWithIv(iv, encryptedPayload),
    },
    sessionKey,
  };
}

/**
 * Server — decrypt an incoming encrypted envelope.
 *
 * Unwraps the AES session key with the RSA private key, then decrypts the payload.
 * The returned `sessionKey` is used to encrypt the response so the client can decrypt it.
 */
export async function decryptRequest(
  envelope: EncryptedEnvelope,
  privateKeyPem: string
): Promise<{ plaintext: string; sessionKey: CryptoKey }> {
  const privateKey = await importPrivateKey(privateKeyPem);

  const rawSessionKey = await globalThis.crypto.subtle.decrypt(
    RSA_ALG,
    privateKey,
    fromBase64(envelope.encryptedKey)
  );

  const sessionKey = await importAesKey(rawSessionKey, ["decrypt", "encrypt"]);
  const { iv, ciphertext } = unsealWithIv(envelope.payload);

  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: AES_ALG, iv },
    sessionKey,
    ciphertext
  );

  return { plaintext: new TextDecoder().decode(decryptedBuffer), sessionKey };
}

/**
 * Server — encrypt a response using the session key recovered from the request.
 *
 * A fresh IV is generated for each response and prepended to the ciphertext.
 */
export async function encryptResponse(
  plaintext: string,
  sessionKey: CryptoKey
): Promise<EncryptedResponse> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(GCM_IV_BYTES));
  const encoded = new Uint8Array(new TextEncoder().encode(plaintext));
  const encrypted = await globalThis.crypto.subtle.encrypt({ name: AES_ALG, iv }, sessionKey, encoded);
  return { payload: sealWithIv(iv, encrypted) };
}

/**
 * Client — decrypt the server's response using the session key from the original request.
 */
export async function decryptResponse(
  response: EncryptedResponse,
  sessionKey: CryptoKey
): Promise<string> {
  const { iv, ciphertext } = unsealWithIv(response.payload);
  const decrypted = await globalThis.crypto.subtle.decrypt(
    { name: AES_ALG, iv },
    sessionKey,
    ciphertext
  );
  return new TextDecoder().decode(decrypted);
}
