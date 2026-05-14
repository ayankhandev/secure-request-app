import { type NextRequest } from "next/server";

import { decryptRequest, encryptResponse, type EncryptedEnvelope } from "@/lib/crypto";

interface Credentials {
  username: string;
  password: string;
}

function isValidEnvelope(value: unknown): value is EncryptedEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.encryptedKey === "string" &&
    typeof v.iv === "string" &&
    typeof v.payload === "string"
  );
}

function isCredentials(value: unknown): value is Credentials {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.username === "string" && typeof v.password === "string";
}

export async function POST(request: NextRequest) {
  const privateKey = process.env.RSA_PRIVATE_KEY;
  if (!privateKey) {
    return Response.json({ error: "Server misconfiguration." }, { status: 500 });
  }

  let body: { envelope?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!isValidEnvelope(body.envelope)) {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  let plaintext: string;
  let sessionKey: CryptoKey;
  try {
    ({ plaintext, sessionKey } = await decryptRequest(body.envelope, privateKey));
  } catch {
    return Response.json({ error: "Failed to decrypt payload." }, { status: 400 });
  }

  let credentials: unknown;
  try {
    credentials = JSON.parse(plaintext);
  } catch {
    return Response.json({ error: "Invalid payload format." }, { status: 400 });
  }

  if (!isCredentials(credentials)) {
    return Response.json({ error: "Invalid credentials format." }, { status: 400 });
  }

  if (credentials.username !== "admin" || credentials.password !== "password") {
    const encrypted = await encryptResponse(
      JSON.stringify({ error: "Invalid username or password." }),
      sessionKey
    );
    return Response.json(encrypted, { status: 401 });
  }

  const encrypted = await encryptResponse(
    JSON.stringify({ message: "Login successful.", user: { username: credentials.username } }),
    sessionKey
  );
  return Response.json(encrypted);
}
