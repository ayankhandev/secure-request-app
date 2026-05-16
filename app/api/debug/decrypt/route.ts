import { type NextRequest } from "next/server";

import { decryptRequest } from "@/lib/crypto";
import { isValidEnvelope } from "@/lib/envelope";

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return Response.json({ error: "Not available in production." }, { status: 404 });
  }

  const privateKey = process.env.RSA_PRIVATE_KEY;
  if (!privateKey) {
    return Response.json({ error: "Server misconfiguration: missing private key." }, { status: 500 });
  }

  let body: { envelope?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isValidEnvelope(body.envelope)) {
    return Response.json(
      { error: "Malformed envelope. Expected { encryptedKey, payload }." },
      { status: 400 }
    );
  }

  try {
    const { plaintext } = await decryptRequest(body.envelope, privateKey);
    let parsed: unknown;
    try {
      parsed = JSON.parse(plaintext);
    } catch {
      return Response.json({ plaintext, formatted: plaintext });
    }
    return Response.json({
      plaintext,
      formatted: JSON.stringify(parsed, null, 2),
    });
  } catch {
    return Response.json({ error: "Failed to decrypt payload." }, { status: 400 });
  }
}
