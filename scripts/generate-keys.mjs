#!/usr/bin/env node
/**
 * Generates a fresh RSA-2048 key pair and prints the .env.local lines.
 * Usage: node scripts/generate-keys.mjs >> .env.local
 */
import { generateKeyPairSync } from "crypto";

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding:  { type: "spki",  format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
});

const inline = (pem) => `"${pem.replace(/\n/g, "\\n")}"`;

console.log(`NEXT_PUBLIC_RSA_PUBLIC_KEY=${inline(publicKey)}`);
console.log(`RSA_PRIVATE_KEY=${inline(privateKey)}`);
