import type { EncryptedEnvelope } from "@/lib/crypto";

export function isValidEnvelope(value: unknown): value is EncryptedEnvelope {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.encryptedKey === "string" && typeof v.payload === "string";
}
